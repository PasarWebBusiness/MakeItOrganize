import { cookies } from 'next/headers';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createSession } from '@/lib/auth';
import { registerGoogleUser, resolveGoogleUserForLogin } from '@/lib/google-identity';
import { getGoogleIntegrationConfig } from '@/lib/integration-env';
import { GoogleOAuthProvider } from '@/lib/google-oauth';
import { consumeGoogleLoginTransaction } from '@/lib/oauth-state';

const LOGIN_STATE_COOKIE = 'mio_google_login_state';

function sameState(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function errorRedirect(origin: string, code: string) {
  return Response.redirect(new URL(`/login?google_error=${encodeURIComponent(code)}`, origin), 302);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const state = requestUrl.searchParams.get('state') ?? '';
  const code = requestUrl.searchParams.get('code') ?? '';
  const providerError = requestUrl.searchParams.get('error');
  const cookieStore = await cookies();
  const cookieState = cookieStore.get(LOGIN_STATE_COOKIE)?.value ?? '';
  cookieStore.delete(LOGIN_STATE_COOKIE);
  if (providerError) return errorRedirect(requestUrl.origin, providerError === 'access_denied' ? 'cancelled' : 'provider');
  if (!state || !code || !cookieState || !sameState(state, cookieState)) return errorRedirect(requestUrl.origin, 'invalid_state');

  try {
    const config = getGoogleIntegrationConfig();
    const transaction = await consumeGoogleLoginTransaction(state, config.encryptionKey);
    const provider = new GoogleOAuthProvider(config.clientId, config.clientSecret);
    const tokenSet = await provider.exchangeCode({
      code,
      codeVerifier: transaction.codeVerifier,
      expectedNonce: transaction.nonce,
      redirectUri: config.authRedirectUri,
    });
    if (transaction.intent === 'register') {
      await registerGoogleUser(tokenSet);
      return Response.redirect(new URL('/login?google_registered=1', requestUrl.origin), 302);
    }
    const userId = await resolveGoogleUserForLogin(tokenSet);
    const returnUrl = new URL(transaction.returnTo, requestUrl.origin);
    await createSession(userId);
    return Response.redirect(returnUrl, 302);
  } catch (error) {
    const codeName = error instanceof Error
      ? {
          GOOGLE_ACCOUNT_MUST_BE_LINKED: 'link_required',
          GOOGLE_ACCOUNT_NOT_REGISTERED: 'not_registered',
          GOOGLE_ACCOUNT_ALREADY_REGISTERED: 'already_registered',
        }[error.message] ?? 'failed'
      : 'failed';
    return errorRedirect(requestUrl.origin, codeName);
  }
}
