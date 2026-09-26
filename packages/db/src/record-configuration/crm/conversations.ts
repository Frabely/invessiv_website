import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { ConversationsConstraintName } from "@invessiv/db/constraint-names/crm/conversations-constraint-names";
import { customers } from "./customers";
import { projects } from "./projects";
import { workspaceMembers } from "./workspace-members";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey(),
    customer_id: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    project_id: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    owner_member_id: uuid("owner_member_id")
      .notNull()
      .references(() => workspaceMembers.id),
    version: integer("version").notNull(),
    last_message_at: timestamp("last_message_at", { withTimezone: true }),
    internal_notified_at: timestamp("internal_notified_at", {
      withTimezone: true,
    }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      ConversationsConstraintName.VersionCheck,
      sql`${t.version}
        > 0`,
    ),
    index(ConversationsConstraintName.OwnerCustomerIndex).on(
      t.owner_member_id,
      t.customer_id,
    ),
    uniqueIndex(ConversationsConstraintName.CustomerProjectUnique).on(
      t.customer_id,
      sql`coalesce(
            ${t.project_id},
            '00000000-0000-0000-0000-000000000000'
            :
            :
            uuid
            )`,
    ),
  ],
);
