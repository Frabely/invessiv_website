import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { PortalInvitationsConstraintName } from "@invessiv/db/constraint-names/crm/portal-invitations-constraint-names";
import { workspaceMembers } from "@invessiv/db/record-configuration/crm/workspace-members";
import { customerContactAssignments } from "@invessiv/db/record-configuration/crm/customer-contacts";

/**
 * One invitation token for one contact assignment. Only the SHA-256 hash is stored; the plaintext
 * exists only in the response to the inviter and, from Ordner 20c, in the outbox mail payload.
 * The partial unique index allows exactly one open (unredeemed, unrevoked) invitation per
 * assignment: inviting again must retire the old one, not create a second valid token.
 */
export const portalInvitations = pgTable(
  "portal_invitations",
  {
    id: uuid("id").primaryKey(),
    assignment_id: uuid("assignment_id")
      .notNull()
      .references(() => customerContactAssignments.id, {
        onDelete: "cascade",
      }),
    token_hash: text("token_hash").notNull(),
    email_notifications_enabled: boolean(
      "email_notifications_enabled",
    ).notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    redeemed_at: timestamp("redeemed_at", { withTimezone: true }),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
    created_by_member_id: uuid("created_by_member_id")
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "restrict" }),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      PortalInvitationsConstraintName.RedemptionStateCheck,
      sql`${table.redeemed_at}
            is null or
            ${table.revoked_at}
            is
            null`,
    ),
    uniqueIndex(PortalInvitationsConstraintName.TokenHashUnique).on(
      table.token_hash,
    ),
    uniqueIndex(PortalInvitationsConstraintName.OpenUnique).on(
      table.assignment_id,
    ).where(sql`${table.redeemed_at}
            is null and
            ${table.revoked_at}
            is
            null`),
    index(PortalInvitationsConstraintName.ExpiresIndex).on(table.expires_at)
      .where(sql`${table.redeemed_at}
            is null and
            ${table.revoked_at}
            is
            null`),
  ],
);
