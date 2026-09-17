'use server';

import { getDb } from '@/db';
import { auditEvents, calendarEvents, integrationConnections, tasks } from '@/db/schema';
import { requireDefaultWorkspace } from '@/lib/authorization';
import { GoogleCalendarProvider, type GoogleCalendarEventPayload } from '@/lib/google-calendar';
import { getGoogleCalendarAccessToken, getGoogleTasksAccessToken } from '@/lib/google-identity';
import { GoogleTasksProvider, type GoogleTaskPayload } from '@/lib/google-tasks';
import { ProviderError } from '@/lib/integration-providers';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const MAX_SYNC_PAGES = 20;
const MAX_TASK_LISTS = 50;

function eventInstant(value?: { date?: string; dateTime?: string }): Date | undefined {
  const source = value?.dateTime ?? (value?.date ? `${value.date}T00:00:00+07:00` : undefined);
  if (!source) return undefined;
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function persistGoogleEvent(workspaceId: string, connectionId: string, event: {
  externalId: string;
  etag?: string;
  deleted: boolean;
  payload: unknown;
}) {
  const db = getDb();
  const scopedExternalId = `${connectionId}:${event.externalId}`;
  if (event.deleted) {
    await db.delete(calendarEvents).where(and(
      eq(calendarEvents.workspaceId, workspaceId),
      eq(calendarEvents.externalProvider, 'google'),
      eq(calendarEvents.externalId, scopedExternalId),
    ));
    return 'removed' as const;
  }
  const payload = event.payload as GoogleCalendarEventPayload;
  const startsAt = eventInstant(payload.start);
  const endsAt = eventInstant(payload.end);
  if (!startsAt || !endsAt || endsAt <= startsAt) return 'skipped' as const;
  const title = payload.summary?.trim().slice(0, 200) || '(Tanpa judul)';
  const now = new Date();
  await db.insert(calendarEvents).values({
    id: crypto.randomUUID(),
    workspaceId,
    title,
    startsAt,
    endsAt,
    timezone: payload.start?.timeZone ?? payload.end?.timeZone ?? (payload.start?.date ? 'Asia/Jakarta' : 'UTC'),
    recurrence: payload.recurrence ? JSON.stringify(payload.recurrence) : null,
    externalProvider: 'google',
    externalId: scopedExternalId,
    etag: event.etag,
    syncStatus: 'synced',
  }).onConflictDoUpdate({
    target: [calendarEvents.workspaceId, calendarEvents.externalProvider, calendarEvents.externalId],
    set: {
      title,
      startsAt,
      endsAt,
      timezone: payload.start?.timeZone ?? payload.end?.timeZone ?? (payload.start?.date ? 'Asia/Jakarta' : 'UTC'),
      recurrence: payload.recurrence ? JSON.stringify(payload.recurrence) : null,
      etag: event.etag,
      syncStatus: 'synced',
      updatedAt: now,
    },
  });
  return 'synced' as const;
}

async function pullCalendar(input: {
  workspaceId: string;
  accessToken: string;
  connectionId: string;
  syncToken?: string;
}) {
  const provider = new GoogleCalendarProvider();
  let pageToken: string | undefined;
  let nextSyncToken: string | undefined;
  let synced = 0;
  let removed = 0;
  let skipped = 0;

  for (let page = 0; page < MAX_SYNC_PAGES; page += 1) {
    const result = await provider.listChanges({
      accessToken: input.accessToken,
      syncToken: input.syncToken,
      pageToken,
      timeMin: input.syncToken ? undefined : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
    for (const event of result.events) {
      const outcome = await persistGoogleEvent(input.workspaceId, input.connectionId, event);
      if (outcome === 'synced') synced += 1;
      else if (outcome === 'removed') removed += 1;
      else skipped += 1;
    }
    pageToken = result.nextPageToken;
    nextSyncToken = result.nextSyncToken ?? nextSyncToken;
    if (!pageToken) return { synced, removed, skipped, nextSyncToken };
  }
  throw new ProviderError('temporarily_unavailable', 'Sinkronisasi melebihi batas halaman aman', true);
}

export async function syncGoogleCalendarAction() {
  const { user, workspaceId } = await requireDefaultWorkspace('update');
  const db = getDb();
  const { connection, accessToken } = await getGoogleCalendarAccessToken(user.id, workspaceId);
  let result;
  try {
    result = await pullCalendar({ workspaceId, accessToken, connectionId: connection.id, syncToken: connection.syncCursor ?? undefined });
  } catch (error) {
    if (error instanceof ProviderError && error.code === 'invalid_cursor') {
      await db.update(integrationConnections).set({ syncCursor: null, updatedAt: new Date() }).where(eq(integrationConnections.id, connection.id));
      result = await pullCalendar({ workspaceId, accessToken, connectionId: connection.id });
    } else {
      await db.update(integrationConnections).set({
        status: error instanceof ProviderError && error.code === 'unauthorized' ? 'reauth_required' : connection.status,
        lastErrorCode: error instanceof ProviderError ? error.code : 'calendar_sync_failed',
        updatedAt: new Date(),
      }).where(eq(integrationConnections.id, connection.id));
      throw error;
    }
  }

  const now = new Date();
  await db.batch([
    db.update(integrationConnections).set({
      syncCursor: result.nextSyncToken ?? connection.syncCursor,
      lastSyncedAt: now,
      lastErrorCode: null,
      status: 'active',
      updatedAt: now,
    }).where(eq(integrationConnections.id, connection.id)),
    db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      workspaceId,
      actorType: 'user',
      actorId: user.id,
      action: 'integration.google_calendar.pull',
      targetType: 'integration_connection',
      targetId: connection.id,
      outcome: 'success',
      authorization: 'update',
      redactedDiff: JSON.stringify({ synced: result.synced, removed: result.removed, skipped: result.skipped }),
      correlationId: crypto.randomUUID(),
      createdAt: now,
    }),
  ]);
  revalidatePath('/');
  return { ok: true, synced: result.synced, removed: result.removed, skipped: result.skipped };
}

function googleTaskDue(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function persistGoogleTask(input: {
  workspaceId: string;
  userId: string;
  connectionId: string;
  taskListId: string;
  taskListTitle: string;
  payload: GoogleTaskPayload;
}) {
  if (!input.payload.id) return 'skipped' as const;
  const externalId = `${input.connectionId}:${input.taskListId}:${input.payload.id}`;
  const db = getDb();
  if (input.payload.deleted) {
    await db.update(tasks).set({ deletedAt: new Date(), syncStatus: 'synced', updatedAt: new Date() }).where(and(
      eq(tasks.workspaceId, input.workspaceId),
      eq(tasks.externalProvider, 'google'),
      eq(tasks.externalId, externalId),
    ));
    return 'removed' as const;
  }

  const completed = input.payload.status === 'completed';
  const title = input.payload.title?.trim().slice(0, 200) || '(Tanpa judul)';
  const now = new Date();
  await db.insert(tasks).values({
    id: crypto.randomUUID(),
    workspaceId: input.workspaceId,
    creatorId: input.userId,
    title,
    description: input.payload.notes?.slice(0, 4_000) || null,
    dueAt: googleTaskDue(input.payload.due),
    priority: 'medium',
    status: completed ? 'done' : 'todo',
    completedAt: completed ? googleTaskDue(input.payload.completed) ?? now : null,
    externalProvider: 'google',
    externalId,
    externalContainer: input.taskListTitle.slice(0, 200),
    etag: input.payload.etag,
    syncStatus: 'synced',
  }).onConflictDoUpdate({
    target: [tasks.workspaceId, tasks.externalProvider, tasks.externalId],
    set: {
      title,
      description: input.payload.notes?.slice(0, 4_000) || null,
      dueAt: googleTaskDue(input.payload.due),
      status: completed ? 'done' : 'todo',
      completedAt: completed ? googleTaskDue(input.payload.completed) ?? now : null,
      externalContainer: input.taskListTitle.slice(0, 200),
      etag: input.payload.etag,
      syncStatus: 'synced',
      deletedAt: null,
      updatedAt: now,
    },
  });
  return 'synced' as const;
}

export async function syncGoogleTasksAction() {
  const { user, workspaceId } = await requireDefaultWorkspace('update');
  const db = getDb();
  const { connection, accessToken } = await getGoogleTasksAccessToken(user.id, workspaceId);
  const provider = new GoogleTasksProvider();
  let synced = 0;
  let removed = 0;
  let skipped = 0;

  try {
    const taskLists: Array<{ id: string; title: string }> = [];
    let taskListPageToken: string | undefined;
    for (let page = 0; page < 5 && taskLists.length < MAX_TASK_LISTS; page += 1) {
      const result = await provider.listTaskLists({ accessToken, pageToken: taskListPageToken });
      taskLists.push(...result.taskLists.slice(0, MAX_TASK_LISTS - taskLists.length));
      taskListPageToken = result.nextPageToken;
      if (!taskListPageToken) break;
    }
    for (const taskList of taskLists) {
      let pageToken: string | undefined;
      for (let page = 0; page < MAX_SYNC_PAGES; page += 1) {
        const result = await provider.listTasks({ accessToken, taskListId: taskList.id, pageToken });
        for (const candidate of result.tasks) {
          const outcome = await persistGoogleTask({
            workspaceId,
            userId: user.id,
            connectionId: connection.id,
            taskListId: taskList.id,
            taskListTitle: taskList.title,
            payload: candidate as GoogleTaskPayload,
          });
          if (outcome === 'synced') synced += 1;
          else if (outcome === 'removed') removed += 1;
          else skipped += 1;
        }
        pageToken = result.nextPageToken;
        if (!pageToken) break;
        if (page === MAX_SYNC_PAGES - 1) {
          throw new ProviderError('temporarily_unavailable', 'Sinkronisasi Google Tasks melebihi batas halaman aman', true);
        }
      }
    }
  } catch (error) {
    await db.update(integrationConnections).set({
      status: error instanceof ProviderError && error.code === 'unauthorized' ? 'reauth_required' : connection.status,
      lastErrorCode: error instanceof ProviderError ? error.code : 'tasks_sync_failed',
      updatedAt: new Date(),
    }).where(eq(integrationConnections.id, connection.id));
    throw error;
  }

  const now = new Date();
  await db.batch([
    db.update(integrationConnections).set({ lastSyncedAt: now, lastErrorCode: null, status: 'active', updatedAt: now }).where(eq(integrationConnections.id, connection.id)),
    db.insert(auditEvents).values({
      id: crypto.randomUUID(), workspaceId, actorType: 'user', actorId: user.id,
      action: 'integration.google_tasks.pull', targetType: 'integration_connection', targetId: connection.id,
      outcome: 'success', authorization: 'update', redactedDiff: JSON.stringify({ synced, removed, skipped }),
      correlationId: crypto.randomUUID(), createdAt: now,
    }),
  ]);
  revalidatePath('/');
  return { ok: true, synced, removed, skipped };
}
