'use server';

import { getDb } from '@/db';
import { passwordCredentials, users, workspaces } from '@/db/schema';
import { createSession } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email dan password wajib diisi.' };
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    return { error: 'Email atau password salah.' };
  }

  const [cred] = await db
    .select()
    .from(passwordCredentials)
    .where(eq(passwordCredentials.userId, user.id))
    .limit(1);

  if (!cred || !verifyPassword(password, cred.hash)) {
    return { error: 'Email atau password salah.' };
  }

  // Create session
  await createSession(user.id);
  redirect('/');
}

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!name || !email || !password) {
    return { error: 'Semua kolom wajib diisi.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Password tidak cocok.' };
  }

  if (password.length < 8) {
    return { error: 'Password minimal 8 karakter.' };
  }

  const db = getDb();
  
  // Check if email exists
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    return { error: 'Email sudah terdaftar.' };
  }

  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();

  // Create user, personal workspace, and credentials in a transaction
  // Note: D1 transactions are batch based. Since we are using basic Drizzle, we can do batch or sequential.
  await db.batch([
    db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      name,
    }),
    db.insert(passwordCredentials).values({
      userId: userId,
      hash: hashPassword(password),
    }),
    db.insert(workspaces).values({
      id: workspaceId,
      name: `Workspace ${name}`,
      type: 'personal',
      ownerId: userId,
    })
  ]);

  await createSession(userId);
  redirect('/');
}

export async function logoutAction() {
  const { clearSession } = await import('@/lib/auth');
  await clearSession();
  redirect('/login');
}
