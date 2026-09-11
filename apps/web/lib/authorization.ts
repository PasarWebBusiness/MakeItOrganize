import { getDb } from '@/db';
import { memberships, workspaces } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';

export type WorkspaceRole = 'owner' | 'manager' | 'editor' | 'commenter' | 'viewer';
export type WorkspaceCapability = 'read' | 'create' | 'update' | 'delete' | 'manage_integrations' | 'manage_members';

const allowedRoles: Record<WorkspaceCapability, ReadonlySet<WorkspaceRole>> = {
  read: new Set(['owner', 'manager', 'editor', 'commenter', 'viewer']),
  create: new Set(['owner', 'manager', 'editor']),
  update: new Set(['owner', 'manager', 'editor']),
  delete: new Set(['owner', 'manager']),
  manage_integrations: new Set(['owner', 'manager']),
  manage_members: new Set(['owner', 'manager']),
};

export async function requireAuthenticatedUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  capability: WorkspaceCapability,
) {
  const user = await requireAuthenticatedUser();
  const db = getDb();
  const [membership] = await db
    .select({ role: memberships.role, status: memberships.status })
    .from(memberships)
    .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, user.id)))
    .limit(1);

  if (!membership || membership.status !== 'active' || !allowedRoles[capability].has(membership.role)) {
    throw new Error('Forbidden');
  }

  return { user, workspaceId, role: membership.role };
}

export async function requireDefaultWorkspace(capability: WorkspaceCapability = 'read') {
  const user = await requireAuthenticatedUser();
  const db = getDb();
  let [workspace] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .innerJoin(
      memberships,
      and(eq(memberships.workspaceId, workspaces.id), eq(memberships.userId, user.id)),
    )
    .where(and(eq(memberships.status, 'active'), eq(workspaces.type, 'personal')))
    .limit(1);

  if (!workspace) {
    // Accounts created before workspace membership became mandatory can still
    // have a valid session. Repair that legacy state idempotently instead of
    // crashing the whole application. A deterministic id closes the race when
    // multiple page requests arrive at the same time.
    const [ownedPersonalWorkspace] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.ownerId, user.id), eq(workspaces.type, 'personal')))
      .limit(1);
    const workspaceId = ownedPersonalWorkspace?.id ?? `personal-${user.id}`;

    if (!ownedPersonalWorkspace) {
      await db
        .insert(workspaces)
        .values({
          id: workspaceId,
          name: `Workspace ${user.name}`,
          type: 'personal',
          ownerId: user.id,
        })
        .onConflictDoNothing();
    }

    await db
      .insert(memberships)
      .values({ workspaceId, userId: user.id, role: 'owner', status: 'active' })
      .onConflictDoNothing();
    workspace = { id: workspaceId };
  }

  return requireWorkspaceAccess(workspace.id, capability);
}
