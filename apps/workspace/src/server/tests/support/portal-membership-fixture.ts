import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customerContactAssignments,
  portalMembershipRoles,
  portalMemberships,
} from "@invessiv/db/record-configuration";

/**
 * An activated contact of `customerId` with the standard portal role, as an invitation would leave
 * it. User and person must exist; the caller cleans up through the customer cascade.
 */
export async function insertStandardPortalMembership(
  db: ReturnType<typeof getDrizzleDatabaseClient>,
  input: {
    customerId: string;
    personId: string;
    userId: string;
    assignedByMemberId: string;
    isPrimary: boolean;
  },
): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(customerContactAssignments).values({
    id: crypto.randomUUID(),
    customer_id: input.customerId,
    person_id: input.personId,
    is_primary: input.isPrimary,
    version: 1,
  });
  await db.insert(portalMemberships).values({
    id,
    customer_id: input.customerId,
    person_id: input.personId,
    user_id: input.userId,
    activated_at: new Date(),
    email_notifications_enabled: false,
    version: 1,
  });
  await db.insert(portalMembershipRoles).values({
    portal_membership_id: id,
    role_id: SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.PortalStandard].id,
    role_realm: AuthRealm.Portal,
    assigned_by_member_id: input.assignedByMemberId,
    assigned_at: new Date(),
  });
  return id;
}
