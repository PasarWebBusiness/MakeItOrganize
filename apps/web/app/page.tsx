import { WorkspaceApp } from '@/components/workspace-app';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { fetchUserTasks } from '@/app/actions/core';
import type { Priority, Task, TaskStatus } from '@/lib/types';

const priorities = new Set<Priority>(['high', 'medium', 'low']);
const statuses = new Set<TaskStatus>(['todo', 'in_progress', 'done', 'cancelled']);

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const dbTasks = await fetchUserTasks();
  
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
  }));

  return <WorkspaceApp user={user} initialTasks={mappedTasks} />;
}
