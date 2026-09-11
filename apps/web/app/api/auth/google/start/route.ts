import { cookies } from 'next/headers';
import { createGoogleLoginTransaction } from '@/lib/oauth-state';
import { getGoogleIntegrationConfig } from '@/lib/integration-env';
import {
  GoogleOAuthProvider,
  GOOGLE_CALENDAR_READ_SCOPE,
  GOOGLE_IDENTITY_SCOPES,
} from '@/lib/google-oauth';

const LOGIN_STATE_COOKIE = 'mio_google_login_state';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  try {
    const withCalendar = requestUrl.searchParams.get('calendar') === '1';
    const config = getGoogleIntegrationConfig();
    const transaction = await createGoogleLoginTransaction(
      requestUrl.searchParams.get('returnTo') ?? (withCalendar ? '/?view=calendar' : '/'),
      config.encryptionKey,
    );
    const cookieStore = await cookies();
    cookieStore.set(LOGIN_STATE_COOKIE, transaction.state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/',
    });
    const provider = new GoogleOAuthProvider(config.clientId, config.clientSecret);
    return Response.redirect(
      provider.authorizationUrl({
        redirectUri: config.authRedirectUri,
        state: transaction.state,
        nonce: transaction.nonce,
        codeChallenge: transaction.codeChallenge,
        scopes: withCalendar
          ? [...GOOGLE_IDENTITY_SCOPES, GOOGLE_CALENDAR_READ_SCOPE]
          : [...GOOGLE_IDENTITY_SCOPES],
        accessType: withCalendar ? 'offline' : 'online',
        prompt: withCalendar ? 'consent' : 'select_account',
      }),
      302,
    );
  } catch {
    return Response.redirect(new URL('/login?google_error=configuration', requestUrl.origin), 302);
  }
}
