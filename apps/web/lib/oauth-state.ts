import { getDb } from '@/db';
import { oauthLoginTransactions, oauthTransactions } from '@/db/schema';
import { requireDefaultWorkspace } from '@/lib/authorization';
import { encryptIntegrationSecret, decryptIntegrationSecret } from '@/lib/integration-crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeReturnTo(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  try {
    const base = new URL('https://makeitorganize.invalid/');
    const resolved = new URL(value, base);
    return resolved.origin === base.origin
      ? `${resolved.pathname}${resolved.search}${resolved.hash}`
      : '/';
  } catch {
    return '/';
  }
}

export async function createGoogleOAuthTransaction(returnTo: string, encryptionKey: string) {
  const { user, workspaceId } = await requireDefaultWorkspace('manage_integrations');
  const state = base64Url(randomBytes(32));
  const codeVerifier = base64Url(randomBytes(48));
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const nonce = base64Url(randomBytes(32));
  const id = crypto.randomUUID();

  await getDb().insert(oauthTransactions).values({
    id,
    userId: user.id,
    workspaceId,
    provider: 'google',
    stateHash: sha256(state),
    codeVerifierCiphertext: await encryptIntegrationSecret(codeVerifier, encryptionKey),
    nonceCiphertext: await encryptIntegrationSecret(nonce, encryptionKey),
    returnTo: safeReturnTo(returnTo),
    expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
  });

  return { state, nonce, codeChallenge, codeChallengeMethod: 'S256' as const };
}

export async function consumeGoogleOAuthTransaction(state: string, encryptionKey: string) {
  const { user } = await requireDefaultWorkspace('manage_integrations');
  const db = getDb();
  const [transaction] = await db
    .select()
    .from(oauthTransactions)
    .where(
      and(
        eq(oauthTransactions.stateHash, sha256(state)),
        eq(oauthTransactions.userId, user.id),
        isNull(oauthTransactions.consumedAt),
      ),
    )
    .limit(1);

  if (!transaction || transaction.expiresAt.getTime() <= Date.now()) {
    throw new Error('OAuth transaction is invalid or expired');
  }

  const [claimed] = await db
    .update(oauthTransactions)
    .set({ consumedAt: new Date() })
    .where(and(eq(oauthTransactions.id, transaction.id), isNull(oauthTransactions.consumedAt)))
    .returning({ id: oauthTransactions.id });
  if (!claimed) throw new Error('OAuth transaction was already consumed');

  return {
    workspaceId: transaction.workspaceId,
    returnTo: transaction.returnTo,
    codeVerifier: await decryptIntegrationSecret(transaction.codeVerifierCiphertext, encryptionKey),
    nonce: await decryptIntegrationSecret(transaction.nonceCiphertext, encryptionKey),
  };
}

export async function createGoogleLoginTransaction(returnTo: string, encryptionKey: string) {
  const state = base64Url(randomBytes(32));
  const codeVerifier = base64Url(randomBytes(48));
  const nonce = base64Url(randomBytes(32));
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

  await getDb().insert(oauthLoginTransactions).values({
    id: crypto.randomUUID(),
    stateHash: sha256(state),
    codeVerifierCiphertext: await encryptIntegrationSecret(codeVerifier, encryptionKey),
    nonceCiphertext: await encryptIntegrationSecret(nonce, encryptionKey),
    returnTo: safeReturnTo(returnTo),
    expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
  });

  return { state, nonce, codeChallenge, codeChallengeMethod: 'S256' as const };
}

export async function consumeGoogleLoginTransaction(state: string, encryptionKey: string) {
  const db = getDb();
  const [transaction] = await db
    .select()
    .from(oauthLoginTransactions)
    .where(and(eq(oauthLoginTransactions.stateHash, sha256(state)), isNull(oauthLoginTransactions.consumedAt)))
    .limit(1);

  if (!transaction || transaction.expiresAt.getTime() <= Date.now()) {
    throw new Error('OAuth login transaction is invalid or expired');
  }

  const [claimed] = await db
    .update(oauthLoginTransactions)
    .set({ consumedAt: new Date() })
    .where(and(eq(oauthLoginTransactions.id, transaction.id), isNull(oauthLoginTransactions.consumedAt)))
    .returning({ id: oauthLoginTransactions.id });
  if (!claimed) throw new Error('OAuth login transaction was already consumed');

  return {
    returnTo: transaction.returnTo,
    codeVerifier: await decryptIntegrationSecret(transaction.codeVerifierCiphertext, encryptionKey),
    nonce: await decryptIntegrationSecret(transaction.nonceCiphertext, encryptionKey),
  };
}
