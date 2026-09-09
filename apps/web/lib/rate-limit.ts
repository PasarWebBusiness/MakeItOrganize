import { getDb } from '@/db';
import { authRateLimits } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createHash } from 'node:crypto';

function hashKey(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export async function consumeAuthRateLimit(bucket: string, identity: string, limit: number, windowMs: number) {
  const db = getDb();
  const key = hashKey(`${bucket}:${identity.toLowerCase()}`);
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  await db.insert(authRateLimits).values({ key, attempts: 1, resetAt, updatedAt: now }).onConflictDoUpdate({
    target: authRateLimits.key,
    set: {
      attempts: sql`CASE WHEN ${authRateLimits.resetAt} <= ${now.getTime()} THEN 1 ELSE ${authRateLimits.attempts} + 1 END`,
      resetAt: sql`CASE WHEN ${authRateLimits.resetAt} <= ${now.getTime()} THEN ${resetAt.getTime()} ELSE ${authRateLimits.resetAt} END`,
      updatedAt: now,
    },
  });

  const [record] = await db.select().from(authRateLimits).where(eq(authRateLimits.key, key)).limit(1);
  if (record && record.attempts > limit && record.resetAt.getTime() > now.getTime()) {
    throw new Error('RATE_LIMITED');
  }
}
