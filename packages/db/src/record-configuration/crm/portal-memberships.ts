import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { PortalMembershipsConstraintName } from "@invessiv/db/constraint-names/crm/portal-memberships-constraint-names";
import { users } from "@invessiv/db/record-configuration/auth/users";
import { customerContactAssignments } from "@invessiv/db/record-configuration/crm/customer-contacts";
import { customers } from "@invessiv/db/record-configuration/crm/customers";
import { people } from "@invessiv/db/record-configuration/crm/people";

/**
 * A person's portal access to one customer. The composite foreign key to
 * `customer_contact_assignments` is the actual invariant: a membership can only exist for a
 * customer/person pair that is a real contact assignment, not any customer/person pair that
 * happens to both exist. `user_id` is deliberately not unique — the same person carries one row
 * per customer they were invited to.
 */
export const portalMemberships = pgTable(
  "portal_memberships",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    person_id: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "restrict" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    activated_at: timestamp("activated_at", { withTimezone: true }).notNull(),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
    last_seen_at: timestamp("last_seen_at", { withTimezone: true }),
    email_notifications_enabled: boolean(
      "email_notifications_enabled",
    ).notNull(),
    /** Anchor of the 12-hour customer digest (Ordner 20c); null means nothing sent yet. */
    customer_notified_at: timestamp("customer_notified_at", {
      withTimezone: true,
    }),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Cascade, not restrict: this mirrors the direct customer_id -> customers cascade. A purge
    // that deletes the customer (and with it the contact assignment) must not be blocked by a
    // membership that would otherwise need deleting first through a different FK path.
    foreignKey({
      name: PortalMembershipsConstraintName.AssignmentForeignKey,
      columns: [table.customer_id, table.person_id],
      foreignColumns: [
        customerContactAssignments.customer_id,
        customerContactAssignments.person_id,
      ],
    }).onDelete("cascade"),
    check(
      PortalMembershipsConstraintName.VersionCheck,
      sql`${table.version}
            > 0`,
    ),
    uniqueIndex(PortalMembershipsConstraintName.CustomerPersonUnique).on(
      table.customer_id,
      table.person_id,
    ),
    index(PortalMembershipsConstraintName.ActiveUserIndex).on(table.user_id)
      .where(sql`${table.revoked_at}
            is null`),
    index(PortalMembershipsConstraintName.ActiveCustomerIndex).on(
      table.customer_id,
    ).where(sql`${table.revoked_at}
            is null`),
  ],
);
