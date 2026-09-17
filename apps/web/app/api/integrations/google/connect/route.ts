import { getGoogleIntegrationConfig } from '@/lib/integration-env';
import {
  GoogleOAuthProvider,
  GOOGLE_CALENDAR_READ_SCOPE,
  GOOGLE_TASKS_READ_SCOPE,
  GOOGLE_DRIVE_READ_SCOPE,
  GOOGLE_IDENTITY_SCOPES,
} from '@/lib/google-oauth';
import { createGoogleOAuthTransaction } from '@/lib/oauth-state';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  try {
    const config = getGoogleIntegrationConfig();
    const transaction = await createGoogleOAuthTransaction(
      requestUrl.searchParams.get('returnTo') ?? '/?view=settings',
      config.encryptionKey,
    );
    const provider = new GoogleOAuthProvider(config.clientId, config.clientSecret);
    const feature = requestUrl.searchParams.get('feature');
    const scopes = feature === 'calendar'
      ? [...GOOGLE_IDENTITY_SCOPES, GOOGLE_CALENDAR_READ_SCOPE]
      : feature === 'tasks'
        ? [...GOOGLE_IDENTITY_SCOPES, GOOGLE_TASKS_READ_SCOPE]
        : feature === 'drive'
          ? [...GOOGLE_IDENTITY_SCOPES, GOOGLE_DRIVE_READ_SCOPE]
        : [...GOOGLE_IDENTITY_SCOPES];
    return Response.redirect(
      provider.authorizationUrl({
        redirectUri: config.integrationRedirectUri,
        state: transaction.state,
        nonce: transaction.nonce,
        codeChallenge: transaction.codeChallenge,
        scopes,
        accessType: 'offline',
        prompt: 'consent',
      }),
      302,
    );
  } catch {
    return Response.redirect(new URL('/?view=settings&google=unavailable', requestUrl.origin), 302);
  }
}
