'use server';

import { getDb } from '@/db';
import { calendarEvents, courses, tasks } from '@/db/schema';
import { requireDefaultWorkspace } from '@/lib/authorization';
import { TaskStatus } from '@/lib/types';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const priorities = new Set(['high', 'medium', 'low']);
const taskStatuses = new Set<TaskStatus>([
  'todo',
  'in_progress',
  'done',
  'cancelled',
]);
const courseTones = new Set(['coral', 'amber', 'blue', 'purple']);

function requireText(value: string, field: string, maxLength = 160) {
  const clean = value.trim();
  if (!clean) throw new Error(`${field} wajib diisi`);
  if (clean.length > maxLength) {
    throw new Error(`${field} maksimal ${maxLength} karakter`);
  }
  return clean;
}

function courseCode(value?: string) {
  const code = value?.trim().toUpperCase() || null;
  if (code && !/^[A-Z]{2}\d{5}$/.test(code)) {
    throw new Error('Kode mata kuliah harus mengikuti format seperti TI12345');
  }
  return code;
}

function jakartaDate(date: string, time = '00:00') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Tanggal atau waktu tidak valid');
  }
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const calendarCheck = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarCheck.getUTCFullYear() !== year ||
    calendarCheck.getUTCMonth() !== month - 1 ||
    calendarCheck.getUTCDate() !== day ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error('Tanggal atau waktu tidak valid');
  }
  const value = new Date(Date.UTC(year, month - 1, day, hour - 7, minute));
  if (Number.isNaN(value.getTime())) throw new Error('Tanggal atau waktu tidak valid');
  return value;
}

async function findCourseId(
  workspaceId: string,
  courseName?: string,
) {
  if (!courseName) return null;
  const db = getDb();
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.workspaceId, workspaceId),
        eq(courses.name, courseName),
        isNull(courses.deletedAt),
      ),
    )
    .limit(1);
  return course?.id ?? null;
}

export async function fetchUserCourses() {
  const { workspaceId } = await requireDefaultWorkspace('read');

  const db = getDb();
  return db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      lecturer: courses.lecturer,
      color: courses.color,
      createdAt: courses.createdAt,
    })
    .from(courses)
    .where(and(eq(courses.workspaceId, workspaceId), isNull(courses.deletedAt)))
    .orderBy(desc(courses.createdAt));
}

export async function createCourseAction(data: {
  name: string;
  code?: string;
  lecturer?: string;
  tone?: string;
}) {
  const { workspaceId } = await requireDefaultWorkspace('create');

  const name = requireText(data.name, 'Nama mata kuliah', 120);
  const code = courseCode(data.code);
  const lecturer = data.lecturer?.trim().slice(0, 120) || null;
  const tone = data.tone && courseTones.has(data.tone) ? data.tone : 'blue';
  const db = getDb();

  const [duplicate] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.workspaceId, workspaceId),
        eq(courses.name, name),
        isNull(courses.deletedAt),
      ),
    )
    .limit(1);
  if (duplicate) throw new Error('Mata kuliah dengan nama ini sudah ada');

  const id = crypto.randomUUID();
  await db.insert(courses).values({
    id,
    workspaceId,
    name,
    code,
    lecturer,
    color: tone,
  });

  revalidatePath('/');
  return id;
}

export async function updateCourseAction(
  courseId: string,
  data: { name: string; code?: string; lecturer?: string; tone?: string },
) {
  const { workspaceId } = await requireDefaultWorkspace('update');

  const name = requireText(data.name, 'Nama mata kuliah', 120);
  const tone = data.tone && courseTones.has(data.tone) ? data.tone : 'blue';
  const db = getDb();
  const [duplicate] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(
      and(
        eq(courses.workspaceId, workspaceId),
        eq(courses.name, name),
        isNull(courses.deletedAt),
      ),
    )
    .limit(1);
  if (duplicate && duplicate.id !== courseId) {
    throw new Error('Mata kuliah dengan nama ini sudah ada');
  }
  await db
    .update(courses)
    .set({
      name,
      code: courseCode(data.code),
      lecturer: data.lecturer?.trim().slice(0, 120) || null,
      color: tone,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(courses.id, courseId),
        eq(courses.workspaceId, workspaceId),
        isNull(courses.deletedAt),
      ),
    );

  revalidatePath('/');
}

export async function archiveCourseAction(courseId: string) {
  const { workspaceId } = await requireDefaultWorkspace('delete');

  const db = getDb();
  await db
    .update(courses)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(courses.id, courseId),
        eq(courses.workspaceId, workspaceId),
        isNull(courses.deletedAt),
      ),
    );

  revalidatePath('/');
}

export async function fetchUserCalendarEvents() {
  const { workspaceId } = await requireDefaultWorkspace('read');

  const db = getDb();
  return db
    .select({
      id: calendarEvents.id,
      title: calendarEvents.title,
      startsAt: calendarEvents.startsAt,
      endsAt: calendarEvents.endsAt,
      timezone: calendarEvents.timezone,
      recurrence: calendarEvents.recurrence,
      courseName: courses.name,
      createdAt: calendarEvents.createdAt,
    })
    .from(calendarEvents)
    .leftJoin(courses, eq(calendarEvents.courseId, courses.id))
    .where(eq(calendarEvents.workspaceId, workspaceId))
    .orderBy(calendarEvents.startsAt);
}

export async function createCalendarEventAction(data: {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  courseName?: string;
}) {
  const { workspaceId } = await requireDefaultWorkspace('create');

  const title = requireText(data.title, 'Judul event', 200);
  const startsAt = jakartaDate(data.date, data.startTime || '00:00');
  const endsAt = data.endTime
    ? jakartaDate(data.date, data.endTime)
    : new Date(startsAt.getTime() + 60 * 60 * 1000);
  if (endsAt <= startsAt) throw new Error('Waktu selesai harus setelah mulai');

  const courseId = await findCourseId(workspaceId, data.courseName);
  const id = crypto.randomUUID();
  const db = getDb();
  await db.insert(calendarEvents).values({
    id,
    workspaceId,
    courseId,
    title,
    startsAt,
    endsAt,
    timezone: 'Asia/Jakarta',
    syncStatus: 'local',
  });
  revalidatePath('/');
  return id;
}

export async function updateCalendarEventAction(
  eventId: string,
  data: {
    title: string;
    date: string;
    startTime?: string;
    endTime?: string;
    courseName?: string;
  },
) {
  const { workspaceId } = await requireDefaultWorkspace('update');

  const startsAt = jakartaDate(data.date, data.startTime || '00:00');
  const endsAt = data.endTime
    ? jakartaDate(data.date, data.endTime)
    : new Date(startsAt.getTime() + 60 * 60 * 1000);
  if (endsAt <= startsAt) throw new Error('Waktu selesai harus setelah mulai');
  const courseId = await findCourseId(workspaceId, data.courseName);

  const db = getDb();
  await db
    .update(calendarEvents)
    .set({
      title: requireText(data.title, 'Judul event', 200),
      startsAt,
      endsAt,
      courseId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.workspaceId, workspaceId),
      ),
    );
  revalidatePath('/');
}

export async function deleteCalendarEventAction(eventId: string) {
  const { workspaceId } = await requireDefaultWorkspace('delete');

  const db = getDb();
  await db
    .delete(calendarEvents)
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.workspaceId, workspaceId),
      ),
    );
  revalidatePath('/');
}

export async function fetchUserTasks() {
  const { workspaceId } = await requireDefaultWorkspace('read');
  const db = getDb();

  return await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      dueAt: tasks.dueAt,
      priority: tasks.priority,
      status: tasks.status,
      courseName: courses.name,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .leftJoin(courses, eq(tasks.courseId, courses.id))
    .where(eq(tasks.workspaceId, workspaceId))
    .orderBy(desc(tasks.createdAt));
}

export async function createTaskAction(data: {
  title: string;
  courseName?: string;
  dueAt?: number;
  priority: 'high' | 'medium' | 'low';
}) {
  const { user, workspaceId } = await requireDefaultWorkspace('create');

  const title = requireText(data.title, 'Judul tugas', 200);
  if (!priorities.has(data.priority)) throw new Error('Prioritas tidak valid');
  if (data.dueAt !== undefined && !Number.isFinite(data.dueAt)) {
    throw new Error('Tenggat tidak valid');
  }

  const db = getDb();
  const id = crypto.randomUUID();
  let courseId: string | null = null;

  if (data.courseName) courseId = await findCourseId(workspaceId, data.courseName);

  await db.insert(tasks).values({
    id,
    workspaceId,
    creatorId: user.id,
    title,
    courseId,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    priority: data.priority,
    status: 'todo',
  });

  revalidatePath('/');
  return id;
}

export async function toggleTaskAction(taskId: string, newStatus: TaskStatus) {
  if (!taskStatuses.has(newStatus)) throw new Error('Status tidak valid');
  const { workspaceId } = await requireDefaultWorkspace('update');

  const db = getDb();
  await db
    .update(tasks)
    .set({ status: newStatus, completedAt: newStatus === 'done' ? new Date() : null })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));

  revalidatePath('/');
}

export async function updateTaskTitleAction(taskId: string, title: string) {
  const { workspaceId } = await requireDefaultWorkspace('update');

  const cleanTitle = requireText(title, 'Judul tugas', 200);

  const db = getDb();
  await db
    .update(tasks)
    .set({ title: cleanTitle, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));

  revalidatePath('/');
}

export async function deleteTaskAction(taskId: string) {
  const { workspaceId } = await requireDefaultWorkspace('delete');

  const db = getDb();
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));

  revalidatePath('/');
}
