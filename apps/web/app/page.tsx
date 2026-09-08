import { WorkspaceApp } from '@/components/workspace-app';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { fetchUserTasks } from '@/app/actions/core';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const dbTasks = await fetchUserTasks();
  
  // Map DB schema to UI Task type
  const mappedTasks = dbTasks.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description || undefined,
    course: t.courseId || 'General',
    due: t.dueAt ? new Date(t.dueAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Belum dijadwalkan',
    dueDate: t.dueAt ? new Date(t.dueAt).toISOString().split('T')[0] : undefined,
    priority: t.priority as any,
    status: t.status as any,
  }));

  return <WorkspaceApp user={user} initialTasks={mappedTasks} />;
}
