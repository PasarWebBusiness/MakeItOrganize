'use server';

import { getDb } from '@/db';
import { auditEvents, calendarEvents, integrationConnections } from '@/db/schema';
import { requireDefaultWorkspace } from '@/lib/authorization';
import { GoogleCalendarProvider, type GoogleCalendarEventPayload } from '@/lib/google-calendar';
import { getGoogleCalendarAccessToken } from '@/lib/google-identity';
import { ProviderError } from '@/lib/integration-providers';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const MAX_SYNC_PAGES = 20;

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
