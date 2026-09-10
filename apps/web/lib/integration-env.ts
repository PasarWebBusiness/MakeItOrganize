import { env } from 'cloudflare:workers';

export interface GoogleIntegrationConfig {
  clientId: string;
  clientSecret: string;
  authRedirectUri: string;
  integrationRedirectUri: string;
  encryptionKey: string;
}

function required(name: keyof Cloudflare.Env): string {
  const value = env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required integration configuration: ${name}`);
  }
  return value;
}

export function getGoogleIntegrationConfig(): GoogleIntegrationConfig {
  return {
    clientId: required('GOOGLE_CLIENT_ID'),
    clientSecret: required('GOOGLE_CLIENT_SECRET'),
    authRedirectUri: required('GOOGLE_AUTH_REDIRECT_URI'),
    integrationRedirectUri: required('GOOGLE_INTEGRATION_REDIRECT_URI'),
    encryptionKey: required('OAUTH_TOKEN_ENCRYPTION_KEY'),
  };
}
