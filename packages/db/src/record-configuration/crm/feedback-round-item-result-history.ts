import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  FEEDBACK_ITEM_RESULT_VALUES,
  FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE,
} from "@invessiv/common/constants/crm/feedback-item-results";
import {
  FEEDBACK_RESULT_ACTOR_SIDE_VALUES,
  FeedbackResultActorSide as A,
} from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import {
  FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES,
  FeedbackResultHistoryEventKind as K,
} from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackRoundItemResultHistoryConstraintName as N } from "@invessiv/db/constraint-names/crm/feedback-round-item-result-history-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { feedbackRoundItems } from "./feedback-round-items";
import { portalMemberships } from "./portal-memberships";
import { workspaceMembers } from "./workspace-members";

export const feedbackRoundItemResultHistory = pgTable(
  "feedback_round_item_result_history",
  {
    id: uuid("id").primaryKey(),
    item_id: uuid("item_id").notNull(),
    item_version: integer("item_version").notNull(),
    event_kind: text("event_kind", {
      enum: FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES,
    }).notNull(),
    result: text("result", { enum: FEEDBACK_ITEM_RESULT_VALUES }),
    result_note: text("result_note"),
    result_set_by_member_id: uuid("result_set_by_member_id"),
    result_set_at: timestamp("result_set_at", { withTimezone: true }),
    actor_side: text("actor_side", {
      enum: FEEDBACK_RESULT_ACTOR_SIDE_VALUES,
    }).notNull(),
    actor_member_id: uuid("actor_member_id"),
    actor_portal_membership_id: uuid("actor_portal_membership_id"),
    occurred_at: timestamp("occurred_at", { withTimezone: true }).notNull(),
    command_id: uuid("command_id"),
    request_version: integer("request_version"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.ItemForeignKey,
      columns: [t.item_id],
      foreignColumns: [feedbackRoundItems.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.ResultSetByForeignKey,
      columns: [t.result_set_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    foreignKey({
      name: N.ActorMemberForeignKey,
      columns: [t.actor_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    foreignKey({
      name: N.ActorPortalMembershipForeignKey,
      columns: [t.actor_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }).onDelete("set null"),
    unique(N.ItemVersionUnique).on(t.item_id, t.item_version),
    uniqueIndex(N.ItemCommandUnique)
      .on(t.item_id, t.command_id)
      .where(sql`${t.command_id} is not null`),
    check(
      N.EventKindCheck,
      sqlCheckIn(t.event_kind, FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES),
    ),
    check(
      N.ActorSideCheck,
      sqlCheckIn(t.actor_side, FEEDBACK_RESULT_ACTOR_SIDE_VALUES),
    ),
    check(N.ResultCheck, sqlCheckIn(t.result, FEEDBACK_ITEM_RESULT_VALUES)),
    check(
      N.ResultNoteLengthCheck,
      sql`length(${t.result_note}) <= ${sqlLimit(FEEDBACK_LIMITS.noteMaxLength)}`,
    ),
    check(N.ItemVersionCheck, sql`${t.item_version} > 0`),
    check(N.RequestVersionCheck, sql`${t.request_version} > 0`),
    check(
      N.SnapshotCheck,
      sql`(${t.event_kind} = ${K.Reset} and num_nonnulls(${t.result}, ${t.result_note}, ${t.result_set_by_member_id}, ${t.result_set_at}) = 0) or (${t.event_kind} <> ${K.Reset} and num_nonnulls(${t.result}, ${t.result_set_by_member_id}, ${t.result_set_at}) = 3 and (${t.result_note} is null or ${t.result} is not null))`,
    ),
    check(
      N.ResultReplyCheck,
      sql`${t.result} is null or not (${sqlCheckIn(t.result, FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE)}) or btrim(coalesce(${t.result_note}, '')) <> ''`,
    ),
    check(
      N.ActorCheck,
      sql`(${t.actor_side} = ${A.Member} and ${t.actor_member_id} is not null and ${t.actor_portal_membership_id} is null) or (${t.actor_side} = ${A.PortalContact} and ${t.actor_member_id} is null)`,
    ),
    check(
      N.KindActorCheck,
      sql`${t.event_kind} = ${K.Reset} or ${t.actor_side} = ${A.Member}`,
    ),
    check(
      N.CommandCheck,
      sql`num_nonnulls(${t.command_id}, ${t.request_version}) in (0, 2) and (${t.event_kind} <> ${K.Baseline} or ${t.command_id} is null)`,
    ),
  ],
);
