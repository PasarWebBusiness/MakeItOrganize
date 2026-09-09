import { getDb } from '@/db';
import { oauthTransactions } from '@/db/schema';
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
  return value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export async function createGoogleOAuthTransaction(returnTo: string, encryptionKey: string) {
  const { user, workspaceId } = await requireDefaultWorkspace('manage_integrations');
  const state = base64Url(randomBytes(32));
  const codeVerifier = base64Url(randomBytes(48));
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  const id = crypto.randomUUID();

  await getDb().insert(oauthTransactions).values({
    id,
    userId: user.id,
    workspaceId,
    provider: 'google',
    stateHash: sha256(state),
    codeVerifierCiphertext: await encryptIntegrationSecret(codeVerifier, encryptionKey),
    returnTo: safeReturnTo(returnTo),
    expiresAt: new Date(Date.now() + OAUTH_STATE_TTL_MS),
  });

  return { state, codeChallenge, codeChallengeMethod: 'S256' as const };
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

  await db
    .update(oauthTransactions)
    .set({ consumedAt: new Date() })
    .where(and(eq(oauthTransactions.id, transaction.id), isNull(oauthTransactions.consumedAt)));

  return {
    workspaceId: transaction.workspaceId,
    returnTo: transaction.returnTo,
    codeVerifier: await decryptIntegrationSecret(transaction.codeVerifierCiphertext, encryptionKey),
  };
}
