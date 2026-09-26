import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  MESSAGE_SENDER_SIDE_VALUES,
  MESSAGE_TYPE_VALUES,
  MessageSenderSide,
} from "@invessiv/common/constants/crm/message-types";
import { MessagesConstraintName } from "@invessiv/db/constraint-names/crm/messages-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { conversations } from "./conversations";
import { customers } from "./customers";
import { portalMemberships } from "./portal-memberships";
import { workspaceMembers } from "./workspace-members";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey(),
    conversation_id: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    customer_id: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    type: text("type", { enum: MESSAGE_TYPE_VALUES }).notNull(),
    body: text("body"),
    metadata: jsonb("metadata").$type<Record<string, string>>(),
    sender_side: text("sender_side", {
      enum: MESSAGE_SENDER_SIDE_VALUES,
    }).notNull(),
    sender_member_id: uuid("sender_member_id").references(
      () => workspaceMembers.id,
    ),
    sender_portal_membership_id: uuid("sender_portal_membership_id").references(
      () => portalMemberships.id,
    ),
    sender_display_name: text("sender_display_name").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    redacted_at: timestamp("redacted_at", { withTimezone: true }),
    redacted_by_member_id: uuid("redacted_by_member_id").references(
      () => workspaceMembers.id,
    ),
  },
  (t) => [
    check(
      MessagesConstraintName.TypeCheck,
      sqlCheckIn(t.type, MESSAGE_TYPE_VALUES),
    ),
    check(
      MessagesConstraintName.SenderSideCheck,
      sqlCheckIn(t.sender_side, MESSAGE_SENDER_SIDE_VALUES),
    ),
    check(
      MessagesConstraintName.SenderConsistencyCheck,
      sql`(${t.sender_side} = ${MessageSenderSide.Internal} AND ${t.sender_member_id} IS NOT NULL AND ${t.sender_portal_membership_id} IS NULL)
                OR (
                ${t.sender_side}
                =
                ${MessageSenderSide.Customer}
                AND
                ${t.sender_member_id}
                IS
                NULL
                AND
                ${t.sender_portal_membership_id}
                IS
                NOT
                NULL
                )
                OR
                (
                ${t.sender_side}
                =
                ${MessageSenderSide.System}
                AND
                ${t.sender_member_id}
                IS
                NULL
                AND
                ${t.sender_portal_membership_id}
                IS
                NULL
                )`,
    ),
    check(
      MessagesConstraintName.BodyCheck,
      sql`${t.body}
            IS NOT NULL OR
            ${t.redacted_at}
            IS
            NOT
            NULL`,
    ),
    index(MessagesConstraintName.ConversationOrderIndex).on(
      t.conversation_id,
      t.created_at.desc(),
      t.id.desc(),
    ),
    index(MessagesConstraintName.CustomerOrderIndex).on(
      t.customer_id,
      t.created_at.desc(),
    ),
    index(MessagesConstraintName.PortalSenderOrderIndex).on(
      t.sender_portal_membership_id,
      t.created_at.desc(),
    ),
  ],
);
