import { WorkspaceApp } from '@/components/workspace-app';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // We will pass user to WorkspaceApp later
  return <WorkspaceApp user={user} />;
}
