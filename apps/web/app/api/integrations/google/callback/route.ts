import { getGoogleIntegrationConfig } from '@/lib/integration-env';
import { GoogleOAuthProvider } from '@/lib/google-oauth';
import { saveGoogleConnection } from '@/lib/google-identity';
import { consumeGoogleOAuthTransaction } from '@/lib/oauth-state';

function settingsRedirect(origin: string, status: string) {
  return Response.redirect(new URL(`/?view=settings&google=${encodeURIComponent(status)}`, origin), 302);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const state = requestUrl.searchParams.get('state') ?? '';
  const code = requestUrl.searchParams.get('code') ?? '';
  const providerError = requestUrl.searchParams.get('error');
  if (providerError) return settingsRedirect(requestUrl.origin, providerError === 'access_denied' ? 'cancelled' : 'failed');
  if (!state || !code) return settingsRedirect(requestUrl.origin, 'invalid_state');

  try {
    const config = getGoogleIntegrationConfig();
    const transaction = await consumeGoogleOAuthTransaction(state, config.encryptionKey);
    const provider = new GoogleOAuthProvider(config.clientId, config.clientSecret);
    const tokenSet = await provider.exchangeCode({
      code,
      codeVerifier: transaction.codeVerifier,
      expectedNonce: transaction.nonce,
      redirectUri: config.integrationRedirectUri,
    });
    const { requireWorkspaceAccess } = await import('@/lib/authorization');
    const { user } = await requireWorkspaceAccess(transaction.workspaceId, 'manage_integrations');
    await saveGoogleConnection(user.id, transaction.workspaceId, tokenSet, config.encryptionKey);
    const returnUrl = new URL(transaction.returnTo, requestUrl.origin);
    returnUrl.searchParams.set('google', 'connected');
    return Response.redirect(returnUrl, 302);
  } catch {
    return settingsRedirect(requestUrl.origin, 'failed');
  }
}
