import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { ConversationReadsConstraintName } from "@invessiv/db/constraint-names/crm/conversation-reads-constraint-names";
import { conversations } from "./conversations";
import { portalMemberships } from "./portal-memberships";
import { workspaceMembers } from "./workspace-members";

export const conversationReads = pgTable(
  "conversation_reads",
  {
    id: uuid("id").primaryKey(),
    conversation_id: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    member_id: uuid("member_id").references(() => workspaceMembers.id, {
      onDelete: "cascade",
    }),
    portal_membership_id: uuid("portal_membership_id").references(
      () => portalMemberships.id,
      { onDelete: "cascade" },
    ),
    last_read_at: timestamp("last_read_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    check(
      ConversationReadsConstraintName.ReaderCheck,
      sql`num_nonnulls
        (
        ${t.member_id},
        ${t.portal_membership_id}
        )
        =
        1`,
    ),
    uniqueIndex(ConversationReadsConstraintName.MemberUnique).on(
      t.conversation_id,
      t.member_id,
    ).where(sql`${t.member_id}
          IS NOT NULL`),
    uniqueIndex(ConversationReadsConstraintName.PortalMemberUnique).on(
      t.conversation_id,
      t.portal_membership_id,
    ).where(sql`${t.portal_membership_id}
          IS NOT NULL`),
  ],
);
