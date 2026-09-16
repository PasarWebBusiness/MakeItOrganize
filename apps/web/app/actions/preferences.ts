'use server';

import { getDb } from '@/db';
import { userPreferences } from '@/db/schema';
import { requireDefaultWorkspace } from '@/lib/authorization';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export type PreferenceKey = 'browserNotifications' | 'emailNotifications' | 'weeklySummary' | 'aiRead' | 'aiMove' | 'aiCreate';

export async function fetchUserPreferences() {
  const { user, workspaceId } = await requireDefaultWorkspace('read');
  const [preferences] = await getDb()
    .select()
    .from(userPreferences)
    .where(and(eq(userPreferences.userId, user.id), eq(userPreferences.workspaceId, workspaceId)))
    .limit(1);

  return preferences ?? {
    userId: user.id,
    workspaceId,
    browserNotifications: false,
    emailNotifications: false,
    weeklySummary: false,
    readNotificationIds: '[]',
  };
}

export async function updatePreferenceAction(key: PreferenceKey, value: boolean) {
  const { user, workspaceId } = await requireDefaultWorkspace('update');
  const db = getDb();
  await db
    .insert(userPreferences)
    .values({ userId: user.id, workspaceId, [key]: value })
    .onConflictDoUpdate({
      target: [userPreferences.userId, userPreferences.workspaceId],
      set: { [key]: value, updatedAt: new Date() },
    });
  revalidatePath('/');
}

export async function markNotificationsReadAction(ids: string[]) {
  const { user, workspaceId } = await requireDefaultWorkspace('update');
  const normalized = [...new Set(ids.filter((id) => typeof id === 'string' && id.length > 0 && id.length <= 200))].slice(0, 500);
  const db = getDb();
  await db
    .insert(userPreferences)
    .values({ userId: user.id, workspaceId, readNotificationIds: JSON.stringify(normalized) })
    .onConflictDoUpdate({
      target: [userPreferences.userId, userPreferences.workspaceId],
      set: { readNotificationIds: JSON.stringify(normalized), updatedAt: new Date() },
    });
  revalidatePath('/');
}
