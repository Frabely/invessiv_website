import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
  portalInvitationRoles,
  portalInvitations,
  portalMembershipRoles,
  portalMemberships,
  rolePermissions,
  roles,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { portalAccessMappingService } from "@/server/workspace/crm/services/portal-access/portal-access-mapping-service";

type DatabaseClient = ReturnType<typeof getDrizzleDatabaseClient>;

function listCustomerContacts(db: DatabaseClient, customerId: string) {
  return db
    .select({
      id: customerContactAssignments.id,
      displayName: people.display_name,
    })
    .from(customerContactAssignments)
    .innerJoin(people, eq(people.id, customerContactAssignments.person_id))
    .where(eq(customerContactAssignments.customer_id, customerId));
}

function listPortalRoles(db: DatabaseClient) {
  return db
    .select({
      id: roles.id,
      name: roles.name,
      systemKey: roles.system_key,
      active: roles.active,
      permission: rolePermissions.permission_key,
    })
    .from(roles)
    .leftJoin(rolePermissions, eq(rolePermissions.role_id, roles.id))
    .where(eq(roles.realm, AuthRealm.Portal));
}

function listOpenCustomerInvitations(db: DatabaseClient, customerId: string) {
  return db
    .select({
      id: portalInvitations.id,
      assignmentId: portalInvitations.assignment_id,
      expiresAt: portalInvitations.expires_at,
      createdAt: portalInvitations.created_at,
      roleId: portalInvitationRoles.role_id,
    })
    .from(portalInvitations)
    .innerJoin(
      customerContactAssignments,
      eq(customerContactAssignments.id, portalInvitations.assignment_id),
    )
    .leftJoin(
      portalInvitationRoles,
      eq(portalInvitationRoles.portal_invitation_id, portalInvitations.id),
    )
    .where(
      and(
        eq(customerContactAssignments.customer_id, customerId),
        isNull(portalInvitations.redeemed_at),
        isNull(portalInvitations.revoked_at),
      ),
    );
}

function listActiveCustomerMemberships(db: DatabaseClient, customerId: string) {
  return db
    .select({
      id: portalMemberships.id,
      assignmentId: customerContactAssignments.id,
      version: portalMemberships.version,
      activatedAt: portalMemberships.activated_at,
      lastSeenAt: portalMemberships.last_seen_at,
      emailNotificationsEnabled: portalMemberships.email_notifications_enabled,
      roleId: portalMembershipRoles.role_id,
    })
    .from(portalMemberships)
    .innerJoin(
      customerContactAssignments,
      and(
        eq(
          customerContactAssignments.customer_id,
          portalMemberships.customer_id,
        ),
        eq(customerContactAssignments.person_id, portalMemberships.person_id),
      ),
    )
    .leftJoin(
      portalMembershipRoles,
      eq(portalMembershipRoles.portal_membership_id, portalMemberships.id),
    )
    .where(
      and(
        eq(portalMemberships.customer_id, customerId),
        isNull(portalMemberships.revoked_at),
      ),
    );
}

/** All rows are constrained to the requested customer before joining role data. */
export async function getCustomerPortalAccess(
  customerId: string,
  actor: WorkspaceActor,
): Promise<PortalAccessDto | null> {
  if (
    !isUuid(customerId) ||
    !canOn(actor, Permission.PortalAccessManage, { customerId })
  )
    return null;
  const db = getDrizzleDatabaseClient();
  const [customer] = await db
    .select({
      id: customers.id,
      version: customers.version,
      preview: customers.portal_preview_confirmed_at,
    })
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        crmAccessCondition.forScope(
          accessScope(actor, Permission.PortalAccessManage),
          { customerId: customers.id },
        ),
      ),
    )
    .limit(1);
  if (!customer) return null;
  const [contactRows, roleRows, invitationRows, membershipRows] =
    await Promise.all([
      listCustomerContacts(db, customerId),
      listPortalRoles(db),
      listOpenCustomerInvitations(db, customerId),
      listActiveCustomerMemberships(db, customerId),
    ]);
  return portalAccessMappingService.mapRowsToDto({
    customerId,
    customerVersion: customer.version,
    previewConfirmedAt: customer.preview,
    contacts: contactRows,
    roles: roleRows,
    invitations: invitationRows,
    memberships: membershipRows,
    asOf: new Date(),
  });
}
