import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { type ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  portalMembershipRoles,
  portalMemberships,
  roles,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { PORTAL_E2E_PREFIX as PREFIX } from "@/common/constants/testing/portal-e2e-prefix";
export async function loadSystemRoles(tx: ContactDatabaseTransaction) {
  const found = await tx
    .select({ id: roles.id, key: roles.system_key, active: roles.active })
    .from(roles)
    .where(
      inArray(roles.system_key, [
        SystemRoleKey.WorkspaceOwner,
        SystemRoleKey.PortalStandard,
        SystemRoleKey.PortalCredentials,
      ]),
    );
  const owner = found.find(
    (role) => role.key === SystemRoleKey.WorkspaceOwner && role.active,
  );
  const portal = found.find(
    (role) => role.key === SystemRoleKey.PortalStandard && role.active,
  );
  const credentials = found.find(
    (role) => role.key === SystemRoleKey.PortalCredentials && role.active,
  );
  if (!owner || !portal || !credentials)
    throw new Error(
      "Portal E2E requires active workspace_owner, portal_standard and portal_credentials roles.",
    );
  return {
    ownerId: owner.id,
    portalId: portal.id,
    credentialsId: credentials.id,
  };
}

export async function ensureManager(
  tx: ContactDatabaseTransaction,
  clerkUserId: string,
  ownerRoleId: string,
) {
  await tx
    .insert(users)
    .values({
      id: randomUUID(),
      clerk_user_id: clerkUserId,
      primary_email: "invessiv-portal-manager+clerk_test@example.com",
      first_name: "Portal",
      last_name: "E2E Manager",
      display_name: `${PREFIX} Manager`,
      active: true,
      version: 1,
    })
    .onConflictDoNothing({ target: users.clerk_user_id });
  const [manager] = await tx
    .select({ id: users.id, active: users.active })
    .from(users)
    .where(eq(users.clerk_user_id, clerkUserId))
    .limit(1);
  if (!manager?.active)
    throw new Error("Portal E2E manager identity is missing or inactive.");

  await tx
    .insert(workspaceMembers)
    .values({
      id: randomUUID(),
      user_id: manager.id,
      active: true,
      version: 1,
    })
    .onConflictDoNothing({ target: workspaceMembers.user_id });
  const [member] = await tx
    .select({ id: workspaceMembers.id, active: workspaceMembers.active })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.user_id, manager.id))
    .limit(1);
  if (!member?.active)
    throw new Error("Portal E2E manager membership is missing or inactive.");

  await tx
    .insert(workspaceMemberRoles)
    .values({
      workspace_member_id: member.id,
      role_id: ownerRoleId,
      role_realm: AuthRealm.Workspace,
      assigned_by_user_id: manager.id,
      assigned_at: new Date(),
    })
    .onConflictDoNothing();
  return member.id;
}

/** A contact with an active standard portal membership, created without the invitation flow. */
export async function insertPortalMember(
  tx: ContactDatabaseTransaction,
  input: {
    clerkUserId: string;
    email: string;
    lastName: string;
    displayName?: string;
    customerId: string;
    personId: string;
    portalRoleId: string;
    managerMemberId: string;
  },
) {
  await tx
    .insert(users)
    .values({
      id: randomUUID(),
      clerk_user_id: input.clerkUserId,
      primary_email: input.email,
      first_name: "Portal",
      last_name: input.lastName,
      display_name: input.displayName ?? `${PREFIX} ${input.lastName}`,
      active: true,
      version: 1,
    })
    .onConflictDoNothing({ target: users.clerk_user_id });
  const [user] = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerk_user_id, input.clerkUserId))
    .limit(1);
  if (!user) throw new Error("Portal E2E contact identity is missing.");
  const membershipId = randomUUID();
  await tx.insert(portalMemberships).values({
    id: membershipId,
    customer_id: input.customerId,
    person_id: input.personId,
    user_id: user.id,
    activated_at: new Date(),
    email_notifications_enabled: false,
    version: 1,
  });
  await tx.insert(portalMembershipRoles).values({
    portal_membership_id: membershipId,
    role_id: input.portalRoleId,
    role_realm: AuthRealm.Portal,
    assigned_by_member_id: input.managerMemberId,
    assigned_at: new Date(),
  });
  return membershipId;
}
