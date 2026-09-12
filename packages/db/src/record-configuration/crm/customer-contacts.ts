import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { customers } from "@invessiv/db/record-configuration/crm/customers";
import { people } from "@invessiv/db/record-configuration/crm/people";

/**
 * Assignment of a global person to a customer. The role and any differing business
 * contact details live here, not on the person.
 *
 * The partial unique index enforces AT MOST one primary contact per customer.
 * AT LEAST one is enforced by the atomic create command in Task 04 — that cannot be
 * expressed as a constraint, because customer and assignment are inserted in sequence.
 */
export const customerContactAssignments = pgTable(
  "customer_contact_assignments",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    person_id: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "restrict" }),
    role_label: text("role_label"),
    business_email: text("business_email"),
    business_phone: text("business_phone"),
    is_primary: boolean("is_primary").notNull(),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "customer_contact_assignments_version_check",
      sql`${table.version}
            > 0`,
    ),
    uniqueIndex("customer_contact_assignments_primary_uidx")
      .on(table.customer_id)
      .where(sql`${table.is_primary}`),
    uniqueIndex("customer_contact_assignments_customer_person_uidx").on(
      table.customer_id,
      table.person_id,
    ),
    index("customer_contact_assignments_customer_id_idx").on(table.customer_id),
    index("customer_contact_assignments_person_id_idx").on(table.person_id),
  ],
);
