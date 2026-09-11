export type ProviderFailureCode =
  | 'unauthorized'
  | 'scope_missing'
  | 'rate_limited'
  | 'temporarily_unavailable'
  | 'invalid_cursor'
  | 'invalid_request';

export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderFailureCode,
    message: string,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
  providerAccountId: string;
  accountEmail?: string;
  accountName?: string;
  accountPicture?: string;
  emailVerified: boolean;
}

export interface OAuthProvider {
  authorizationUrl(input: {
    redirectUri: string;
    state: string;
    codeChallenge: string;
    scopes: string[];
    nonce: string;
    accessType?: 'online' | 'offline';
    prompt?: 'none' | 'consent' | 'select_account';
  }): URL;
  exchangeCode(input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    expectedNonce: string;
  }): Promise<OAuthTokenSet>;
  refresh(refreshToken: string): Promise<OAuthTokenSet>;
  revoke(token: string): Promise<void>;
}

export interface CalendarProvider {
  listChanges(input: {
    accessToken: string;
    syncToken?: string;
    pageToken?: string;
    timeMin?: string;
  }): Promise<{
    events: Array<{ externalId: string; etag?: string; deleted: boolean; payload: unknown }>;
    nextPageToken?: string;
    nextSyncToken?: string;
  }>;
  upsertEvent(input: {
    accessToken: string;
    event: unknown;
    idempotencyKey: string;
  }): Promise<{ externalId: string; etag?: string }>;
  deleteEvent(input: {
    accessToken: string;
    externalId: string;
    idempotencyKey: string;
  }): Promise<void>;
}

export interface TasksProvider {
  listTaskLists(accessToken: string): Promise<Array<{ id: string; title: string }>>;
  listTasks(input: {
    accessToken: string;
    taskListId: string;
    pageToken?: string;
  }): Promise<{ tasks: unknown[]; nextPageToken?: string }>;
}

export interface DriveProvider {
  listFiles(input: {
    accessToken: string;
    pageToken?: string;
  }): Promise<{ files: unknown[]; nextPageToken?: string }>;
  downloadFile(input: {
    accessToken: string;
    fileId: string;
  }): Promise<Response>;
}

export interface AiProvider {
  generate(input: {
    systemInstruction: string;
    messages: unknown[];
    tools?: unknown[];
  }): Promise<{ text?: string; toolCalls?: unknown[]; usage?: unknown }>;
}
