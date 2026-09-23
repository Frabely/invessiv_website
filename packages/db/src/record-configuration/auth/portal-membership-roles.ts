import {
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { sqlCheckIn } from "@invessiv/db/core";
import { PortalMembershipRolesConstraintName } from "@invessiv/db/constraint-names/auth/portal-membership-roles-constraint-names";
import { portalMemberships } from "@invessiv/db/record-configuration/crm/portal-memberships";
import { roles } from "@invessiv/db/record-configuration/auth/roles";
import { workspaceMembers } from "@invessiv/db/record-configuration/crm/workspace-members";

const PORTAL_REALM_VALUES = [AuthRealm.Portal] as const;

/**
 * `role_realm` is pinned to `portal` and part of the foreign key, so a workspace role can never
 * be assigned to a portal membership. A membership may hold several roles, and two contacts of
 * the same company may hold different roles.
 */
export const portalMembershipRoles = pgTable(
  "portal_membership_roles",
  {
    portal_membership_id: uuid("portal_membership_id")
      .notNull()
      .references(() => portalMemberships.id, { onDelete: "cascade" }),
    role_id: uuid("role_id").notNull(),
    role_realm: text("role_realm", { enum: PORTAL_REALM_VALUES }).notNull(),
    assigned_by_member_id: uuid("assigned_by_member_id")
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "restrict" }),
    assigned_at: timestamp("assigned_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      name: PortalMembershipRolesConstraintName.PrimaryKey,
      columns: [table.portal_membership_id, table.role_id],
    }),
    foreignKey({
      name: PortalMembershipRolesConstraintName.RoleForeignKey,
      columns: [table.role_id, table.role_realm],
      foreignColumns: [roles.id, roles.realm],
    }).onDelete("restrict"),
    check(
      PortalMembershipRolesConstraintName.RoleRealmCheck,
      sqlCheckIn(table.role_realm, PORTAL_REALM_VALUES),
    ),
    index(PortalMembershipRolesConstraintName.RoleIdIndex).on(table.role_id),
  ],
);
