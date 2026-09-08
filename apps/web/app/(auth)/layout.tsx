import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MakeItOrganize',
  description: 'Login atau buat akun baru.',
};

import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }

  return (
    <div className="auth-shell">
      {children}
    </div>
  );
}
