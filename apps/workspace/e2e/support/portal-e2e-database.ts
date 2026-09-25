import { createHash, randomBytes, randomUUID } from "node:crypto";
import { eq, inArray, like } from "drizzle-orm";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
  portalInvitationRoles,
  portalInvitations,
  roles,
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { PortalE2eFixture } from "./portal-e2e-fixture";

const PREFIX = "Invessiv Portal E2E";

async function loadSystemRoles(tx: ContactDatabaseTransaction) {
  const found = await tx
    .select({ id: roles.id, key: roles.system_key, active: roles.active })
    .from(roles)
    .where(
      inArray(roles.system_key, [
        SystemRoleKey.WorkspaceOwner,
        SystemRoleKey.PortalStandard,
      ]),
    );
  const owner = found.find(
    (role) => role.key === SystemRoleKey.WorkspaceOwner && role.active,
  );
  const portal = found.find(
    (role) => role.key === SystemRoleKey.PortalStandard && role.active,
  );
  if (!owner || !portal)
    throw new Error(
      "Portal E2E requires active workspace_owner and portal_standard roles.",
    );
  return { ownerId: owner.id, portalId: portal.id };
}

async function ensureManager(
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

async function removeOldCustomers(tx: ContactDatabaseTransaction) {
  const oldCustomers = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(like(customers.display_name, `${PREFIX}%`));
  if (oldCustomers.length) {
    await tx.delete(customers).where(
      inArray(
        customers.id,
        oldCustomers.map((row) => row.id),
      ),
    );
  }
  const oldPeople = await tx
    .select({ id: people.id })
    .from(people)
    .where(like(people.display_name, `${PREFIX}%`));
  if (oldPeople.length) {
    await tx.delete(people).where(
      inArray(
        people.id,
        oldPeople.map((row) => row.id),
      ),
    );
  }
}

export async function preparePortalE2eDatabase(
  managerClerkUserId: string,
): Promise<PortalE2eFixture> {
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const { ownerId, portalId } = await loadSystemRoles(tx);
    const managerMemberId = await ensureManager(
      tx,
      managerClerkUserId,
      ownerId,
    );
    await removeOldCustomers(tx);

    const customerA = randomUUID();
    const customerB = randomUUID();
    const personA = randomUUID();
    const personB = randomUUID();
    const personExpired = randomUUID();
    const assignmentA = randomUUID();
    const assignmentB = randomUUID();
    const assignmentOther = randomUUID();
    const expiredAssignment = randomUUID();

    await tx.insert(people).values([
      {
        id: personA,
        display_name: `${PREFIX} Contact A`,
        primary_email: "invessiv-portal-a+clerk_test@example.com",
        preferred_locale: "de",
        version: 1,
      },
      {
        id: personB,
        display_name: `${PREFIX} Contact B`,
        primary_email: "invessiv-portal-b+clerk_test@example.com",
        preferred_locale: "de",
        version: 1,
      },
      {
        id: personExpired,
        display_name: `${PREFIX} Expired Contact`,
        primary_email: "expired-portal+clerk_test@example.com",
        preferred_locale: "de",
        version: 1,
      },
    ]);
    await tx.insert(customers).values([
      {
        id: customerA,
        display_name: `${PREFIX} Customer A`,
        status: CustomerStatus.Active,
        owner_member_id: managerMemberId,
        version: 1,
      },
      {
        id: customerB,
        display_name: `${PREFIX} Customer B`,
        status: CustomerStatus.Active,
        owner_member_id: managerMemberId,
        version: 1,
      },
    ]);
    await tx.insert(customerContactAssignments).values([
      {
        id: assignmentA,
        customer_id: customerA,
        person_id: personA,
        is_primary: true,
        version: 1,
      },
      {
        id: assignmentB,
        customer_id: customerB,
        person_id: personA,
        is_primary: true,
        version: 1,
      },
      {
        id: assignmentOther,
        customer_id: customerA,
        person_id: personB,
        is_primary: false,
        version: 1,
      },
      {
        id: expiredAssignment,
        customer_id: customerB,
        person_id: personExpired,
        is_primary: false,
        version: 1,
      },
    ]);

    const expiredToken = randomBytes(32).toString("base64url");
    const invitationId = randomUUID();
    await tx.insert(portalInvitations).values({
      id: invitationId,
      assignment_id: expiredAssignment,
      token_hash: createHash("sha256").update(expiredToken).digest("hex"),
      email_notifications_enabled: true,
      expires_at: new Date(Date.now() - 60_000),
      redeemed_at: null,
      revoked_at: null,
      created_by_member_id: managerMemberId,
    });
    await tx.insert(portalInvitationRoles).values({
      portal_invitation_id: invitationId,
      role_id: portalId,
      role_realm: AuthRealm.Portal,
    });
    return {
      customerA,
      customerB,
      assignmentA,
      assignmentB,
      assignmentOther,
      expiredToken,
    };
  });
}
