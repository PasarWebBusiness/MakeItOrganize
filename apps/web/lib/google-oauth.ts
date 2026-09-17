import type { OAuthProvider, OAuthTokenSet } from '@/lib/integration-providers';
import { ProviderError } from '@/lib/integration-providers';

const AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const REVOCATION_ENDPOINT = 'https://oauth2.googleapis.com/revoke';
const JWKS_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/certs';

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleIdClaims = {
  iss?: string;
  aud?: string | string[];
  azp?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

type GoogleJwk = JsonWebKey & { kid?: string; alg?: string; use?: string };

let cachedKeys: { expiresAt: number; keys: GoogleJwk[] } | undefined;

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function parseJsonSegment<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as T;
}

async function getSigningKeys(): Promise<GoogleJwk[]> {
  if (cachedKeys && cachedKeys.expiresAt > Date.now()) return cachedKeys.keys;
  const response = await fetch(JWKS_ENDPOINT);
  if (!response.ok) throw new ProviderError('temporarily_unavailable', 'Google signing keys are unavailable', true);
  const body = (await response.json()) as { keys?: GoogleJwk[] };
  if (!Array.isArray(body.keys)) throw new ProviderError('temporarily_unavailable', 'Google signing key response is invalid', true);
  const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] ?? 300);
  cachedKeys = { keys: body.keys, expiresAt: Date.now() + Math.min(maxAge, 3600) * 1000 };
  return body.keys;
}

async function verifyIdToken(token: string, clientId: string, expectedNonce: string): Promise<GoogleIdClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new ProviderError('unauthorized', 'Google ID token is malformed', false);
  const header = parseJsonSegment<{ alg?: string; kid?: string }>(parts[0]);
  const claims = parseJsonSegment<GoogleIdClaims>(parts[1]);
  if (header.alg !== 'RS256' || !header.kid) throw new ProviderError('unauthorized', 'Google ID token algorithm is invalid', false);

  const jwk = (await getSigningKeys()).find((candidate) => candidate.kid === header.kid && candidate.kty === 'RSA');
  if (!jwk) throw new ProviderError('unauthorized', 'Google ID token signing key is unknown', false);
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const validSignature = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  const now = Math.floor(Date.now() / 1000);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (
    !validSignature ||
    !['https://accounts.google.com', 'accounts.google.com'].includes(claims.iss ?? '') ||
    !audience.includes(clientId) ||
    (audience.length > 1 && claims.azp !== clientId) ||
    !claims.sub ||
    !claims.exp ||
    claims.exp <= now ||
    (claims.iat ?? now) > now + 300 ||
    claims.nonce !== expectedNonce
  ) {
    throw new ProviderError('unauthorized', 'Google ID token validation failed', false);
  }
  return claims;
}

function providerError(body: GoogleTokenResponse, fallback: string): ProviderError {
  const retryable = body.error === 'temporarily_unavailable' || body.error === 'server_error';
  return new ProviderError(
    body.error === 'invalid_grant' ? 'unauthorized' : retryable ? 'temporarily_unavailable' : 'invalid_request',
    body.error_description || fallback,
    retryable,
  );
}

export class GoogleOAuthProvider implements OAuthProvider {
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  authorizationUrl(input: Parameters<OAuthProvider['authorizationUrl']>[0]): URL {
    const url = new URL(AUTHORIZATION_ENDPOINT);
    url.search = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: input.redirectUri,
      response_type: 'code',
      scope: input.scopes.join(' '),
      state: input.state,
      nonce: input.nonce,
      code_challenge: input.codeChallenge,
      code_challenge_method: 'S256',
      include_granted_scopes: 'true',
      access_type: input.accessType ?? 'online',
      ...(input.prompt ? { prompt: input.prompt } : {}),
    }).toString();
    return url;
  }

  async exchangeCode(input: Parameters<OAuthProvider['exchangeCode']>[0]): Promise<OAuthTokenSet> {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: input.code,
        code_verifier: input.codeVerifier,
        redirect_uri: input.redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const body = (await response.json()) as GoogleTokenResponse;
    if (!response.ok || !body.access_token || !body.id_token) throw providerError(body, 'Google token exchange failed');
    const claims = await verifyIdToken(body.id_token, this.clientId, input.expectedNonce);
    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: body.expires_in ? new Date(Date.now() + body.expires_in * 1000) : undefined,
      scopes: body.scope?.split(/\s+/).filter(Boolean) ?? [],
      providerAccountId: claims.sub!,
      accountEmail: claims.email,
      accountName: claims.name,
      accountPicture: claims.picture,
      emailVerified: claims.email_verified === true,
    };
  }

  async refresh(refreshToken: string): Promise<OAuthTokenSet> {
    const response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const body = (await response.json()) as GoogleTokenResponse;
    if (!response.ok || !body.access_token) throw providerError(body, 'Google token refresh failed');
    return {
      accessToken: body.access_token,
      expiresAt: body.expires_in ? new Date(Date.now() + body.expires_in * 1000) : undefined,
      scopes: body.scope?.split(/\s+/).filter(Boolean) ?? [],
      providerAccountId: '',
      emailVerified: false,
    };
  }

  async revoke(token: string): Promise<void> {
    const response = await fetch(REVOCATION_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    });
    if (!response.ok && response.status !== 400) {
      throw new ProviderError('temporarily_unavailable', 'Google token revocation failed', true);
    }
  }
}

export const GOOGLE_IDENTITY_SCOPES = ['openid', 'email', 'profile'] as const;
export const GOOGLE_CALENDAR_READ_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';
export const GOOGLE_TASKS_READ_SCOPE = 'https://www.googleapis.com/auth/tasks.readonly';
export const GOOGLE_DRIVE_READ_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
