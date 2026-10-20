import { and, eq, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  FEEDBACK_CLARIFICATION_STATUS_VALUES,
  FeedbackClarificationStatus as S,
} from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackRoundItemClarificationsConstraintName as N } from "@invessiv/db/constraint-names/crm/feedback-round-item-clarifications-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { feedbackRoundItems } from "./feedback-round-items";
import { workspaceMembers } from "./workspace-members";
import { portalMemberships } from "./portal-memberships";
export const feedbackRoundItemClarifications = pgTable(
  "feedback_round_item_clarifications",
  {
    id: uuid("id").primaryKey(),
    item_id: uuid("item_id").notNull(),
    status: text("status", {
      enum: FEEDBACK_CLARIFICATION_STATUS_VALUES,
    }).notNull(),
    question: text("question").notNull(),
    requested_by_member_id: uuid("requested_by_member_id").notNull(),
    requested_at: timestamp("requested_at", { withTimezone: true }).notNull(),
    request_version: integer("request_version").notNull(),
    answer: text("answer"),
    answered_by_portal_membership_id: uuid("answered_by_portal_membership_id"),
    answered_at: timestamp("answered_at", { withTimezone: true }),
    answer_command_id: uuid("answer_command_id"),
    answer_request_version: integer("answer_request_version"),
    close_note: text("close_note"),
    closed_by_member_id: uuid("closed_by_member_id"),
    closed_at: timestamp("closed_at", { withTimezone: true }),
    close_command_id: uuid("close_command_id"),
    close_request_version: integer("close_request_version"),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => {
    const noAnswer = sql`num_nonnulls(
      ${t.answer},
      ${t.answered_by_portal_membership_id},
      ${t.answered_at},
      ${t.answer_command_id},
      ${t.answer_request_version}
    ) = 0`;
    const noClosure = sql`num_nonnulls(
      ${t.close_note},
      ${t.closed_by_member_id},
      ${t.closed_at},
      ${t.close_command_id},
      ${t.close_request_version}
    ) = 0`;
    // The answer survives deletion of its portal membership, which clears only the author reference.
    const completeAnswer = sql`num_nonnulls(
      ${t.answer},
      ${t.answered_at},
      ${t.answer_command_id},
      ${t.answer_request_version}
    ) = 4`;
    const completeClosure = sql`num_nonnulls(
      ${t.close_note},
      ${t.closed_by_member_id},
      ${t.closed_at},
      ${t.close_command_id},
      ${t.close_request_version}
    ) = 5`;

    const openState = and(eq(t.status, S.Open), noAnswer, noClosure);
    const answeredState = and(
      eq(t.status, S.Answered),
      completeAnswer,
      noClosure,
    );
    const closedState = and(eq(t.status, S.Closed), completeClosure, noAnswer);

    return [
      foreignKey({
        name: N.ItemForeignKey,
        columns: [t.item_id],
        foreignColumns: [feedbackRoundItems.id],
      }).onDelete("cascade"),
      foreignKey({
        name: N.RequestedByForeignKey,
        columns: [t.requested_by_member_id],
        foreignColumns: [workspaceMembers.id],
      }),
      foreignKey({
        name: N.AnsweredByForeignKey,
        columns: [t.answered_by_portal_membership_id],
        foreignColumns: [portalMemberships.id],
      }).onDelete("set null"),
      foreignKey({
        name: N.ClosedByForeignKey,
        columns: [t.closed_by_member_id],
        foreignColumns: [workspaceMembers.id],
      }),
      uniqueIndex(N.OpenItemUnique)
        .on(t.item_id)
        .where(sql`${t.status} = ${S.Open}`),
      index(N.ItemRequestedIndex).on(t.item_id, t.requested_at, t.id),
      uniqueIndex(N.AnswerCommandUnique)
        .on(t.item_id, t.answer_command_id)
        .where(sql`${t.answer_command_id} IS NOT NULL`),
      uniqueIndex(N.CloseCommandUnique)
        .on(t.item_id, t.close_command_id)
        .where(sql`${t.close_command_id} IS NOT NULL`),
      check(
        N.StatusCheck,
        sqlCheckIn(t.status, FEEDBACK_CLARIFICATION_STATUS_VALUES),
      ),
      check(
        N.QuestionCheck,
        sql`btrim(${t.question}) <> '' AND length(${t.question}) <= ${sqlLimit(FEEDBACK_LIMITS.noteMaxLength)}`,
      ),
      check(
        N.AnswerCheck,
        sql`btrim(${t.answer}) <> '' AND length(${t.answer}) <= ${sqlLimit(FEEDBACK_LIMITS.noteMaxLength)}`,
      ),
      check(
        N.CloseNoteCheck,
        sql`btrim(${t.close_note}) <> '' AND length(${t.close_note}) <= ${sqlLimit(FEEDBACK_LIMITS.noteMaxLength)}`,
      ),
      check(N.VersionCheck, sql`${t.version} > 0`),
      check(N.RequestVersionCheck, sql`${t.request_version} > 0`),
      check(N.AnswerRequestVersionCheck, sql`${t.answer_request_version} > 0`),
      check(N.CloseRequestVersionCheck, sql`${t.close_request_version} > 0`),
      check(
        N.StateCheck,
        sql`(${openState}) OR (${answeredState}) OR (${closedState})`,
      ),
    ];
  },
);
