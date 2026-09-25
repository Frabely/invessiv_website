import {
  check,
  foreignKey,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { sqlCheckIn } from "@invessiv/db/core";
import { PortalInvitationRolesConstraintName } from "@invessiv/db/constraint-names/auth/portal-invitation-roles-constraint-names";
import { portalInvitations } from "@invessiv/db/record-configuration/crm/portal-invitations";
import { roles } from "@invessiv/db/record-configuration/auth/roles";

const PORTAL_REALM_VALUES = [AuthRealm.Portal] as const;

/**
 * The roles chosen at invite time, carried over into `portal_membership_roles` on redeem. Same
 * realm pin as `portal_membership_roles`, for the same reason: a workspace role can never be
 * attached to an invitation either.
 */
export const portalInvitationRoles = pgTable(
  "portal_invitation_roles",
  {
    portal_invitation_id: uuid("portal_invitation_id")
      .notNull()
      .references(() => portalInvitations.id, { onDelete: "cascade" }),
    role_id: uuid("role_id").notNull(),
    role_realm: text("role_realm", { enum: PORTAL_REALM_VALUES }).notNull(),
  },
  (table) => [
    primaryKey({
      name: PortalInvitationRolesConstraintName.PrimaryKey,
      columns: [table.portal_invitation_id, table.role_id],
    }),
    foreignKey({
      name: PortalInvitationRolesConstraintName.RoleForeignKey,
      columns: [table.role_id, table.role_realm],
      foreignColumns: [roles.id, roles.realm],
    }).onDelete("restrict"),
    check(
      PortalInvitationRolesConstraintName.RoleRealmCheck,
      sqlCheckIn(table.role_realm, PORTAL_REALM_VALUES),
    ),
  ],
);
