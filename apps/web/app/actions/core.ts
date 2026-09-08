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
    .select()
    .from(tasks)
    .where(eq(tasks.workspaceId, workspaceId))
    .orderBy(desc(tasks.createdAt));
}

export async function createTaskAction(data: {
  title: string;
  courseId?: string;
  dueAt?: number;
  priority: 'high' | 'medium' | 'low';
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const workspaceId = await getPersonalWorkspaceId(user.id);
  if (!workspaceId) throw new Error('No personal workspace found');

  const db = getDb();
  const id = crypto.randomUUID();

  await db.insert(tasks).values({
    id,
    workspaceId,
    creatorId: user.id,
    title: data.title,
    courseId: data.courseId || null,
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
