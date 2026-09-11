import { getDb } from '@/db';
import {
  auditEvents,
  externalIdentities,
  integrationConnections,
  memberships,
  users,
  workspaces,
} from '@/db/schema';
import { requireDefaultWorkspace } from '@/lib/authorization';
import { decryptIntegrationSecret, encryptIntegrationSecret } from '@/lib/integration-crypto';
import { getGoogleIntegrationConfig } from '@/lib/integration-env';
import { GoogleOAuthProvider, GOOGLE_CALENDAR_READ_SCOPE } from '@/lib/google-oauth';
import { ProviderError, type OAuthTokenSet } from '@/lib/integration-providers';
import { and, eq } from 'drizzle-orm';

function normalizedEmail(tokenSet: OAuthTokenSet): string {
  const email = tokenSet.accountEmail?.trim().toLowerCase();
  if (!email || !tokenSet.emailVerified) throw new Error('Google account must provide a verified email');
  return email;
}

export async function resolveOrCreateGoogleUser(tokenSet: OAuthTokenSet): Promise<string> {
  const email = normalizedEmail(tokenSet);
  const db = getDb();
  const [identity] = await db
    .select({ userId: externalIdentities.userId })
    .from(externalIdentities)
    .where(and(eq(externalIdentities.provider, 'google'), eq(externalIdentities.providerSubject, tokenSet.providerAccountId)))
    .limit(1);
  if (identity) return identity.userId;

  // Never merge an OAuth identity into a password account only because the
  // email text matches. The signed-in user must link it from Settings.
  const [emailOwner] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (emailOwner) throw new Error('GOOGLE_ACCOUNT_MUST_BE_LINKED');

  const userId = crypto.randomUUID();
  const workspaceId = crypto.randomUUID();
  const name = tokenSet.accountName?.trim() || email.split('@')[0];
  const now = new Date();
  await db.batch([
    db.insert(users).values({ id: userId, email, name }),
    db.insert(workspaces).values({ id: workspaceId, name: `Workspace ${name}`, type: 'personal', ownerId: userId }),
    db.insert(memberships).values({ workspaceId, userId, role: 'owner', status: 'active' }),
    db.insert(externalIdentities).values({
      id: crypto.randomUUID(),
      userId,
      provider: 'google',
      providerSubject: tokenSet.providerAccountId,
      email,
      emailVerified: true,
    }),
    db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      workspaceId,
      actorType: 'user',
      actorId: userId,
      action: 'auth.google.register',
      targetType: 'user',
      targetId: userId,
      outcome: 'success',
      authorization: 'verified_google_identity',
      correlationId: crypto.randomUUID(),
      createdAt: now,
    }),
  ]);
  return userId;
}

export async function saveGoogleConnection(
  userId: string,
  workspaceId: string,
  tokenSet: OAuthTokenSet,
  encryptionKey: string,
) {
  const email = normalizedEmail(tokenSet);
  const db = getDb();
  const [identityOwner] = await db
    .select({ userId: externalIdentities.userId })
    .from(externalIdentities)
    .where(and(eq(externalIdentities.provider, 'google'), eq(externalIdentities.providerSubject, tokenSet.providerAccountId)))
    .limit(1);
  if (identityOwner && identityOwner.userId !== userId) throw new Error('Google account is already linked to another user');
  const [emailOwner] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (emailOwner && emailOwner.id !== userId) throw new Error('Google email belongs to another MakeItOrganize account');

  const [existing] = await db
    .select()
    .from(integrationConnections)
    .where(
      and(
        eq(integrationConnections.userId, userId),
        eq(integrationConnections.provider, 'google'),
        eq(integrationConnections.providerAccountId, tokenSet.providerAccountId),
      ),
    )
    .limit(1);
  const accessTokenCiphertext = await encryptIntegrationSecret(tokenSet.accessToken, encryptionKey);
  const refreshTokenCiphertext = tokenSet.refreshToken
    ? await encryptIntegrationSecret(tokenSet.refreshToken, encryptionKey)
    : existing?.refreshTokenCiphertext;
  if (!refreshTokenCiphertext) throw new Error('Google did not issue an offline refresh token');
  const now = new Date();
  const connectionId = existing?.id ?? crypto.randomUUID();

  const identityStatement = identityOwner
    ? db
        .update(externalIdentities)
        .set({ email, emailVerified: true, updatedAt: now })
        .where(and(eq(externalIdentities.provider, 'google'), eq(externalIdentities.providerSubject, tokenSet.providerAccountId)))
    : db.insert(externalIdentities).values({
        id: crypto.randomUUID(),
        userId,
        provider: 'google',
        providerSubject: tokenSet.providerAccountId,
        email,
        emailVerified: true,
      });
  const connectionStatement = existing
    ? db
        .update(integrationConnections)
        .set({
          workspaceId,
          accountEmail: email,
          status: 'active',
          grantedScopes: JSON.stringify(tokenSet.scopes),
          accessTokenCiphertext,
          refreshTokenCiphertext,
          tokenExpiresAt: tokenSet.expiresAt,
          lastErrorCode: null,
          revokedAt: null,
          updatedAt: now,
        })
        .where(eq(integrationConnections.id, existing.id))
    : db.insert(integrationConnections).values({
        id: connectionId,
        userId,
        workspaceId,
        provider: 'google',
        providerAccountId: tokenSet.providerAccountId,
        accountEmail: email,
        status: 'active',
        grantedScopes: JSON.stringify(tokenSet.scopes),
        accessTokenCiphertext,
        refreshTokenCiphertext,
        tokenExpiresAt: tokenSet.expiresAt,
      });
  await db.batch([
    identityStatement,
    connectionStatement,
    db.insert(auditEvents).values({
      id: crypto.randomUUID(),
      workspaceId,
      actorType: 'user',
      actorId: userId,
      action: existing ? 'integration.google.reconnect' : 'integration.google.connect',
      targetType: 'integration_connection',
      targetId: connectionId,
      outcome: 'success',
      authorization: 'manage_integrations',
      redactedDiff: JSON.stringify({ accountEmail: email, scopes: tokenSet.scopes }),
      correlationId: crypto.randomUUID(),
      createdAt: now,
    }),
  ]);
}

export async function saveGoogleConnectionAfterLogin(
  userId: string,
  tokenSet: OAuthTokenSet,
  encryptionKey: string,
) {
  const db = getDb();
  const [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .innerJoin(
      memberships,
      and(eq(memberships.workspaceId, workspaces.id), eq(memberships.userId, userId)),
    )
    .where(and(
      eq(workspaces.type, 'personal'),
      eq(workspaces.ownerId, userId),
      eq(memberships.status, 'active'),
    ))
    .limit(1);
  if (!workspace) throw new Error('No personal workspace available for Google connection');
  await saveGoogleConnection(userId, workspace.id, tokenSet, encryptionKey);
}

export type GoogleConnectionSummary = {
  connected: boolean;
  accountEmail?: string;
  grantedScopes: string[];
  status?: 'active' | 'reauth_required' | 'revoked' | 'error';
  calendarEnabled: boolean;
  lastSyncedAt?: string;
};

export async function getGoogleConnectionSummary(): Promise<GoogleConnectionSummary> {
  const { user, workspaceId } = await requireDefaultWorkspace('read');
  const [connection] = await getDb()
    .select({
      accountEmail: integrationConnections.accountEmail,
      grantedScopes: integrationConnections.grantedScopes,
      status: integrationConnections.status,
      lastSyncedAt: integrationConnections.lastSyncedAt,
    })
    .from(integrationConnections)
    .where(
      and(
        eq(integrationConnections.userId, user.id),
        eq(integrationConnections.workspaceId, workspaceId),
        eq(integrationConnections.provider, 'google'),
      ),
    )
    .limit(1);
  if (!connection || connection.status === 'revoked') {
    return { connected: false, grantedScopes: [], calendarEnabled: false };
  }
  let grantedScopes: string[] = [];
  try {
    const parsed: unknown = JSON.parse(connection.grantedScopes);
    if (Array.isArray(parsed)) grantedScopes = parsed.filter((scope): scope is string => typeof scope === 'string');
  } catch {
    // A malformed legacy scope record is treated as no scope, never trusted.
  }
  return {
    connected: connection.status === 'active',
    accountEmail: connection.accountEmail ?? undefined,
    grantedScopes,
    status: connection.status,
    calendarEnabled: grantedScopes.includes(GOOGLE_CALENDAR_READ_SCOPE),
    lastSyncedAt: connection.lastSyncedAt?.toISOString(),
  };
}

export async function getGoogleCalendarAccessToken(userId: string, workspaceId: string) {
  const db = getDb();
  const connections = await db
    .select()
    .from(integrationConnections)
    .where(and(
      eq(integrationConnections.userId, userId),
      eq(integrationConnections.workspaceId, workspaceId),
      eq(integrationConnections.provider, 'google'),
      eq(integrationConnections.status, 'active'),
    ));
  const connection = connections.find((candidate) => {
    try {
      const scopes: unknown = JSON.parse(candidate.grantedScopes);
      return Array.isArray(scopes) && scopes.includes(GOOGLE_CALENDAR_READ_SCOPE);
    } catch {
      return false;
    }
  });
  if (!connection) {
    throw new ProviderError('scope_missing', 'Google Calendar belum diizinkan', false);
  }

  const config = getGoogleIntegrationConfig();
  if (connection.tokenExpiresAt && connection.tokenExpiresAt.getTime() > Date.now() + 60_000) {
    return {
      connection,
      accessToken: await decryptIntegrationSecret(connection.accessTokenCiphertext, config.encryptionKey),
    };
  }
  if (!connection.refreshTokenCiphertext) {
    await db.update(integrationConnections).set({
      status: 'reauth_required',
      lastErrorCode: 'missing_refresh_token',
      updatedAt: new Date(),
    }).where(eq(integrationConnections.id, connection.id));
    throw new ProviderError('unauthorized', 'Koneksi Google perlu dihubungkan ulang', false);
  }

  try {
    const refreshToken = await decryptIntegrationSecret(connection.refreshTokenCiphertext, config.encryptionKey);
    const refreshed = await new GoogleOAuthProvider(config.clientId, config.clientSecret).refresh(refreshToken);
    const accessTokenCiphertext = await encryptIntegrationSecret(refreshed.accessToken, config.encryptionKey);
    await db.update(integrationConnections).set({
      accessTokenCiphertext,
      tokenExpiresAt: refreshed.expiresAt,
      lastErrorCode: null,
      updatedAt: new Date(),
    }).where(eq(integrationConnections.id, connection.id));
    return {
      connection: { ...connection, accessTokenCiphertext, tokenExpiresAt: refreshed.expiresAt ?? null },
      accessToken: refreshed.accessToken,
    };
  } catch (error) {
    const unauthorized = error instanceof ProviderError && error.code === 'unauthorized';
    await db.update(integrationConnections).set({
      status: unauthorized ? 'reauth_required' : connection.status,
      lastErrorCode: error instanceof ProviderError ? error.code : 'token_refresh_failed',
      updatedAt: new Date(),
    }).where(eq(integrationConnections.id, connection.id));
    throw error;
  }
}
