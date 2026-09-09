import { getDb } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createHash, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'mio_session';
const SESSION_EXPIRY_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// --- Password Hashing ---

export function hashPassword(password: string): string {
  const salt = toHex(randomBytes(16));
  const derivedKey = scryptSync(password, salt, 64);
  return `${salt}:${toHex(derivedKey)}`;
}

export function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(':');
  if (!salt || !key || !/^[a-f0-9]{128}$/i.test(key)) return false;
  
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = scryptSync(password, salt, 64);
  return timingSafeEqual(keyBuffer, derivedKey);
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// --- Session Management ---

export async function createSession(userId: string) {
  const db = getDb();
  const sessionToken = toHex(randomBytes(32));
  const sessionId = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
  
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return sessionToken;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (sessionToken) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, hashSessionToken(sessionToken)));
  }
  
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionToken) return null;
  
  const db = getDb();
  
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, hashSessionToken(sessionToken)))
    .limit(1);
  
  if (!session) return null;
  
  if (session.expiresAt.getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, hashSessionToken(sessionToken)));
    return null;
  }
  
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
    
  return user ?? null;
}
