import { WorkspaceApp } from '@/components/workspace-app';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  fetchUserCalendarEvents,
  fetchUserCourses,
  fetchUserTasks,
} from '@/app/actions/core';
import { fetchUserPreferences } from '@/app/actions/preferences';
import { fetchWorkspaceActivities, fetchWorkspaceResources } from '@/app/actions/resources';
import { getGoogleConnectionSummary } from '@/lib/google-identity';
import type {
  CalendarEvent,
  Course,
  FileItem,
  Note,
  Activity,
  CanvasDocument,
  NotificationItem,
  Priority,
  Task,
  TaskStatus,
} from '@/lib/types';

const priorities = new Set<Priority>(['high', 'medium', 'low']);
const statuses = new Set<TaskStatus>(['todo', 'in_progress', 'done', 'cancelled']);

function jakartaParts(value: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

function parseNotificationIds(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [dbTasks, dbCourses, dbEvents, dbResources, dbActivities, preferences, googleConnection] = await Promise.all([
    fetchUserTasks(),
    fetchUserCourses(),
    fetchUserCalendarEvents(),
    fetchWorkspaceResources(),
    fetchWorkspaceActivities(),
    fetchUserPreferences(),
    getGoogleConnectionSummary(),
  ]);
  
  // Map DB schema to UI Task type
  const mappedTasks: Task[] = dbTasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description || undefined,
    course: task.courseName || 'Tanpa mata kuliah',
    due: task.dueAt ? new Date(task.dueAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Belum dijadwalkan',
    dueDate: task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : undefined,
    priority: priorities.has(task.priority as Priority) ? (task.priority as Priority) : 'medium',
    status: statuses.has(task.status as TaskStatus) ? (task.status as TaskStatus) : 'todo',
    externalProvider: task.externalProvider === 'google' ? 'google' : undefined,
    externalContainer: task.externalContainer || undefined,
    readOnly: task.externalProvider === 'google',
  }));

  const mappedCourses: Course[] = dbCourses.map((course) => ({
    id: course.id,
    name: course.name,
    code: course.code || 'TANPA KODE',
    lecturer: course.lecturer || 'Dosen belum diatur',
    tone: ['coral', 'amber', 'blue', 'purple'].includes(course.color)
      ? course.color
      : 'blue',
    progress: (() => {
      const related = mappedTasks.filter((task) => task.course === course.name);
      return related.length ? Math.round((related.filter((task) => task.status === 'done').length / related.length) * 100) : 0;
    })(),
    tasks: mappedTasks.filter((task) => task.course === course.name).length,
    files: dbResources.filter((resource) => resource.type === 'file' && resource.courseName === course.name).length,
  }));

  const requestTime = new Date().getTime();
  const relative = (date: Date) => new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' }).format(
    -Math.max(0, Math.round((requestTime - date.getTime()) / 3_600_000)),
    'hour',
  );
  const mappedNotes: Note[] = dbResources.filter((resource) => resource.type === 'note').map((resource) => ({
    id: resource.id,
    title: resource.name,
    course: resource.courseName || 'Tanpa mata kuliah',
    body: resource.content || '',
    updated: relative(resource.updatedAt),
  }));
  const mappedFiles: FileItem[] = dbResources.filter((resource) => resource.type === 'file').map((resource) => ({
    id: resource.id,
    name: resource.name,
    type: resource.name.split('.').at(-1)?.toUpperCase() || 'FILE',
    size: resource.byteSize ? `${Math.max(1, Math.round(resource.byteSize / 1024))} KB` : '—',
    course: resource.courseName || 'Belum diatur',
    updated: relative(resource.updatedAt),
  }));
  const mappedActivities: Activity[] = dbActivities.map((event) => {
    let resource = event.targetType;
    try { resource = (JSON.parse(event.redactedDiff || '{}') as { name?: string }).name || resource; } catch { /* redacted audit data is optional */ }
    return {
      id: event.id,
      actor: event.actorType === 'ai' ? 'Gemini' : event.actorType === 'provider' ? 'Google Calendar' : 'Kamu',
      action: event.action,
      resource,
      time: relative(event.createdAt),
      status: event.outcome === 'failed' ? 'failed' : event.outcome === 'pending' ? 'pending' : 'success',
      authorization: event.authorization || 'User action',
    };
  });
  const canvasResource = dbResources.find((resource) => resource.type === 'canvas');
  const mappedCanvas: CanvasDocument = canvasResource ? {
    id: canvasResource.id,
    title: canvasResource.name,
    course: canvasResource.courseName || 'Tanpa mata kuliah',
    strokes: canvasResource.content || '[]',
    updated: relative(canvasResource.updatedAt),
  } : { title: 'Canvas tanpa judul', course: 'Tanpa mata kuliah', strokes: '[]', updated: 'Belum disimpan' };

  const mappedEvents: CalendarEvent[] = dbEvents.map((event) => {
    const start = jakartaParts(event.startsAt);
    const end = jakartaParts(event.endsAt);
    return {
      id: event.id,
      title: event.title,
      date: start.date,
      startTime: start.time === '00:00' ? undefined : start.time,
      endTime: end.date === start.date ? end.time : undefined,
      course: event.courseName || undefined,
      type: 'event',
      color: 'blue',
    };
  });
  const now = requestTime;
  const notifications: NotificationItem[] = [
    ...dbTasks.filter((task) => task.status !== 'done' && task.status !== 'cancelled' && task.dueAt && task.dueAt.getTime() <= now + 24 * 3_600_000).map((task) => ({
      id: `task:${task.id}:${task.dueAt!.getTime()}`,
      title: `${task.title} mendekati tenggat`,
      text: `${task.courseName || 'Tanpa mata kuliah'} · ${task.dueAt!.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })}`,
      time: relative(task.createdAt),
      type: 'task' as const,
    })),
    ...dbEvents.filter((event) => event.startsAt.getTime() >= now && event.startsAt.getTime() <= now + 24 * 3_600_000).map((event) => ({
      id: `event:${event.id}:${event.startsAt.getTime()}`,
      title: `${event.title} akan dimulai`,
      text: event.courseName || 'Agenda kalender',
      time: relative(event.createdAt),
      type: 'calendar' as const,
    })),
  ];

  return (
    <WorkspaceApp
      user={user}
      initialTasks={mappedTasks}
      initialCourses={mappedCourses}
      initialCalendarEvents={mappedEvents}
      initialNotes={mappedNotes}
      initialFiles={mappedFiles}
      initialActivities={mappedActivities}
      initialNotifications={notifications}
      initialCanvas={mappedCanvas}
      initialPreferences={{
        browserNotifications: preferences.browserNotifications,
        emailNotifications: preferences.emailNotifications,
        weeklySummary: preferences.weeklySummary,
        aiRead: preferences.aiRead,
        aiMove: preferences.aiMove,
        aiCreate: preferences.aiCreate,
        readNotificationIds: parseNotificationIds(preferences.readNotificationIds),
      }}
      initialGoogleConnection={googleConnection}
    />
  );
}
