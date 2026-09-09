'use server';

import { getDb } from '@/db';
import { courses, tasks, workspaces } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { TaskStatus } from '@/lib/types';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function getPersonalWorkspaceId(userId: string) {
  const db = getDb();
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.ownerId, userId), eq(workspaces.type, 'personal')))
    .limit(1);
  return ws?.id;
}

export async function fetchUserTasks() {
  const user = await getCurrentUser();
  if (!user) return [];

  const db = getDb();
  const workspaceId = await getPersonalWorkspaceId(user.id);
  if (!workspaceId) return [];

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
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const workspaceId = await getPersonalWorkspaceId(user.id);
  if (!workspaceId) throw new Error('No personal workspace found');

  const db = getDb();
  const id = crypto.randomUUID();
  let courseId: string | null = null;

  if (data.courseName) {
    const [course] = await db
      .select({ id: courses.id })
      .from(courses)
      .where(
        and(
          eq(courses.workspaceId, workspaceId),
          eq(courses.name, data.courseName),
        ),
      )
      .limit(1);
    courseId = course?.id ?? null;
  }

  await db.insert(tasks).values({
    id,
    workspaceId,
    creatorId: user.id,
    title: data.title,
    courseId,
    dueAt: data.dueAt ? new Date(data.dueAt) : null,
    priority: data.priority,
    status: 'todo',
  });

  revalidatePath('/');
  return id;
}

export async function toggleTaskAction(taskId: string, newStatus: TaskStatus) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const workspaceId = await getPersonalWorkspaceId(user.id);
  if (!workspaceId) throw new Error('No personal workspace found');

  const db = getDb();
  await db
    .update(tasks)
    .set({ status: newStatus, completedAt: newStatus === 'done' ? new Date() : null })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));

  revalidatePath('/');
}

export async function updateTaskTitleAction(taskId: string, title: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const workspaceId = await getPersonalWorkspaceId(user.id);
  if (!workspaceId) throw new Error('No personal workspace found');

  const cleanTitle = title.trim();
  if (!cleanTitle) throw new Error('Title is required');

  const db = getDb();
  await db
    .update(tasks)
    .set({ title: cleanTitle, updatedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));

  revalidatePath('/');
}

export async function deleteTaskAction(taskId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const workspaceId = await getPersonalWorkspaceId(user.id);
  if (!workspaceId) throw new Error('No personal workspace found');

  const db = getDb();
  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.workspaceId, workspaceId)));

  revalidatePath('/');
}
