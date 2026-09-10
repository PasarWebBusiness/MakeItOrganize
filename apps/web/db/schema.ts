import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

const timestamps = { createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()), updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()) };

export const users = sqliteTable('users', { id: text('id').primaryKey(), email: text('email').notNull(), name: text('name').notNull(), locale: text('locale').notNull().default('id-ID'), timezone: text('timezone').notNull().default('Asia/Jakarta'), ...timestamps }, (table) => [uniqueIndex('users_email_unique').on(table.email)]);

export const passwordCredentials = sqliteTable('password_credentials', { userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }), hash: text('hash').notNull(), ...timestamps });

export const sessions = sqliteTable('sessions', { id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(), ...timestamps });

export const authRateLimits = sqliteTable('auth_rate_limits', {
  key: text('key').primaryKey(),
  attempts: integer('attempts').notNull().default(0),
  resetAt: integer('reset_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const workspaces = sqliteTable('workspaces', { id: text('id').primaryKey(), name: text('name').notNull(), type: text('type', { enum: ['personal', 'shared'] }).notNull(), ownerId: text('owner_id').notNull().references(() => users.id), ...timestamps });

export const memberships = sqliteTable('memberships', { workspaceId: text('workspace_id').notNull().references(() => workspaces.id), userId: text('user_id').notNull().references(() => users.id), role: text('role', { enum: ['owner', 'manager', 'editor', 'commenter', 'viewer'] }).notNull(), status: text('status', { enum: ['invited', 'active', 'suspended'] }).notNull().default('active'), ...timestamps }, (table) => [primaryKey({ columns: [table.workspaceId, table.userId] }), index('memberships_user_idx').on(table.userId)]);

export const semesters = sqliteTable('semesters', { id: text('id').primaryKey(), workspaceId: text('workspace_id').notNull().references(() => workspaces.id), name: text('name').notNull(), startsOn: text('starts_on'), endsOn: text('ends_on'), status: text('status', { enum: ['planned', 'active', 'archived'] }).notNull().default('active'), ...timestamps }, (table) => [index('semesters_workspace_idx').on(table.workspaceId)]);

export const courses = sqliteTable('courses', { id: text('id').primaryKey(), workspaceId: text('workspace_id').notNull().references(() => workspaces.id), semesterId: text('semester_id').references(() => semesters.id), code: text('code'), name: text('name').notNull(), lecturer: text('lecturer'), color: text('color').notNull().default('green'), deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }), ...timestamps }, (table) => [index('courses_workspace_idx').on(table.workspaceId), index('courses_semester_idx').on(table.semesterId)]);

export const tasks = sqliteTable('tasks', { id: text('id').primaryKey(), workspaceId: text('workspace_id').notNull().references(() => workspaces.id), courseId: text('course_id').references(() => courses.id), creatorId: text('creator_id').notNull().references(() => users.id), title: text('title').notNull(), description: text('description'), dueAt: integer('due_at', { mode: 'timestamp_ms' }), timezone: text('timezone').notNull().default('Asia/Jakarta'), priority: text('priority', { enum: ['high', 'medium', 'low'] }).notNull().default('medium'), status: text('status', { enum: ['todo', 'in_progress', 'done', 'cancelled'] }).notNull().default('todo'), completedAt: integer('completed_at', { mode: 'timestamp_ms' }), deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }), ...timestamps }, (table) => [index('tasks_workspace_status_idx').on(table.workspaceId, table.status), index('tasks_due_idx').on(table.dueAt)]);

export const resources = sqliteTable('resources', { id: text('id').primaryKey(), workspaceId: text('workspace_id').notNull().references(() => workspaces.id), courseId: text('course_id').references(() => courses.id), parentId: text('parent_id'), ownerId: text('owner_id').notNull().references(() => users.id), type: text('type', { enum: ['folder', 'file', 'note', 'canvas', 'external'] }).notNull(), name: text('name').notNull(), mediaType: text('media_type'), byteSize: integer('byte_size'), state: text('state', { enum: ['initiated', 'uploaded', 'scanning', 'ready', 'quarantined', 'failed'] }).notNull().default('ready'), deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }), ...timestamps }, (table) => [index('resources_workspace_parent_idx').on(table.workspaceId, table.parentId)]);

export const resourceVersions = sqliteTable('resource_versions', { id: text('id').primaryKey(), resourceId: text('resource_id').notNull().references(() => resources.id), version: integer('version').notNull(), storageKey: text('storage_key'), checksum: text('checksum'), content: text('content'), createdBy: text('created_by').notNull().references(() => users.id), sourceVersionId: text('source_version_id'), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull() }, (table) => [uniqueIndex('resource_versions_number_unique').on(table.resourceId, table.version)]);

export const calendarEvents = sqliteTable('calendar_events', { id: text('id').primaryKey(), workspaceId: text('workspace_id').notNull().references(() => workspaces.id), courseId: text('course_id').references(() => courses.id), taskId: text('task_id').references(() => tasks.id), title: text('title').notNull(), startsAt: integer('starts_at', { mode: 'timestamp_ms' }).notNull(), endsAt: integer('ends_at', { mode: 'timestamp_ms' }).notNull(), timezone: text('timezone').notNull(), recurrence: text('recurrence'), externalProvider: text('external_provider'), externalId: text('external_id'), etag: text('etag'), syncStatus: text('sync_status').notNull().default('local'), ...timestamps }, (table) => [index('events_workspace_start_idx').on(table.workspaceId, table.startsAt), uniqueIndex('events_external_unique').on(table.externalProvider, table.externalId)]);

export const aiGrants = sqliteTable('ai_grants', { id: text('id').primaryKey(), userId: text('user_id').notNull().references(() => users.id), workspaceId: text('workspace_id').notNull().references(() => workspaces.id), capability: text('capability').notNull(), scope: text('scope').notNull(), expiresAt: integer('expires_at', { mode: 'timestamp_ms' }), revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }), ...timestamps }, (table) => [index('ai_grants_actor_idx').on(table.userId, table.workspaceId)]);

export const auditEvents = sqliteTable('audit_events', { id: text('id').primaryKey(), workspaceId: text('workspace_id').notNull().references(() => workspaces.id), actorType: text('actor_type', { enum: ['user', 'ai', 'system', 'provider'] }).notNull(), actorId: text('actor_id'), action: text('action').notNull(), targetType: text('target_type').notNull(), targetId: text('target_id').notNull(), outcome: text('outcome', { enum: ['success', 'pending', 'failed', 'denied'] }).notNull(), authorization: text('authorization'), redactedDiff: text('redacted_diff'), correlationId: text('correlation_id').notNull(), createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull() }, (table) => [index('audit_workspace_time_idx').on(table.workspaceId, table.createdAt), index('audit_target_idx').on(table.targetType, table.targetId)]);

export const externalIdentities = sqliteTable('external_identities', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['google'] }).notNull(),
  providerSubject: text('provider_subject').notNull(),
  email: text('email'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
}, (table) => [
  uniqueIndex('external_identity_provider_subject_unique').on(table.provider, table.providerSubject),
  index('external_identity_user_idx').on(table.userId),
]);

export const integrationConnections = sqliteTable('integration_connections', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['google'] }).notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  accountEmail: text('account_email'),
  status: text('status', { enum: ['active', 'reauth_required', 'revoked', 'error'] }).notNull().default('active'),
  grantedScopes: text('granted_scopes').notNull().default('[]'),
  accessTokenCiphertext: text('access_token_ciphertext').notNull(),
  refreshTokenCiphertext: text('refresh_token_ciphertext'),
  tokenExpiresAt: integer('token_expires_at', { mode: 'timestamp_ms' }),
  syncCursor: text('sync_cursor'),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp_ms' }),
  lastErrorCode: text('last_error_code'),
  revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
  ...timestamps,
}, (table) => [
  uniqueIndex('integration_provider_account_unique').on(table.userId, table.provider, table.providerAccountId),
  index('integration_workspace_status_idx').on(table.workspaceId, table.status),
]);

export const oauthTransactions = sqliteTable('oauth_states', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  provider: text('provider', { enum: ['google'] }).notNull(),
  stateHash: text('state_hash').notNull(),
  codeVerifierCiphertext: text('code_verifier_ciphertext').notNull(),
  nonceCiphertext: text('nonce_ciphertext').notNull(),
  returnTo: text('return_to').notNull().default('/'),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  consumedAt: integer('consumed_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex('oauth_state_hash_unique').on(table.stateHash), index('oauth_state_expiry_idx').on(table.expiresAt)]);

export const oauthLoginTransactions = sqliteTable('oauth_login_states', {
  id: text('id').primaryKey(),
  stateHash: text('state_hash').notNull(),
  codeVerifierCiphertext: text('code_verifier_ciphertext').notNull(),
  nonceCiphertext: text('nonce_ciphertext').notNull(),
  returnTo: text('return_to').notNull().default('/'),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  consumedAt: integer('consumed_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (table) => [uniqueIndex('oauth_login_state_hash_unique').on(table.stateHash), index('oauth_login_state_expiry_idx').on(table.expiresAt)]);

export const integrationJobs = sqliteTable('integration_jobs', {
  id: text('id').primaryKey(),
  connectionId: text('connection_id').notNull().references(() => integrationConnections.id, { onDelete: 'cascade' }),
  kind: text('kind', { enum: ['calendar_pull', 'calendar_push', 'tasks_pull', 'tasks_push', 'drive_import', 'reconcile'] }).notNull(),
  status: text('status', { enum: ['pending', 'running', 'completed', 'failed', 'dead_letter'] }).notNull().default('pending'),
  dedupeKey: text('dedupe_key').notNull(),
  payload: text('payload'),
  attempts: integer('attempts').notNull().default(0),
  availableAt: integer('available_at', { mode: 'timestamp_ms' }).notNull(),
  lockedAt: integer('locked_at', { mode: 'timestamp_ms' }),
  lastErrorCode: text('last_error_code'),
  ...timestamps,
}, (table) => [uniqueIndex('integration_job_dedupe_unique').on(table.dedupeKey), index('integration_job_queue_idx').on(table.status, table.availableAt)]);

export const outboxEvents = sqliteTable('outbox_events', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  topic: text('topic').notNull(),
  aggregateType: text('aggregate_type').notNull(),
  aggregateId: text('aggregate_id').notNull(),
  payload: text('payload').notNull(),
  correlationId: text('correlation_id').notNull(),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (table) => [index('outbox_unpublished_idx').on(table.publishedAt, table.createdAt)]);

export const userPreferences = sqliteTable('user_preferences', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  browserNotifications: integer('browser_notifications', { mode: 'boolean' }).notNull().default(false),
  emailNotifications: integer('email_notifications', { mode: 'boolean' }).notNull().default(false),
  weeklySummary: integer('weekly_summary', { mode: 'boolean' }).notNull().default(false),
  readNotificationIds: text('read_notification_ids').notNull().default('[]'),
  aiRead: integer('ai_read', { mode: 'boolean' }).notNull().default(true),
  aiMove: integer('ai_move', { mode: 'boolean' }).notNull().default(true),
  aiCreate: integer('ai_create', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
}, (table) => [primaryKey({ columns: [table.userId, table.workspaceId] })]);

export const notificationReceipts = sqliteTable('notification_receipts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  notificationId: text('notification_id').notNull(),
  readAt: integer('read_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.notificationId] }), index('notification_receipt_user_idx').on(table.userId, table.readAt)]);
