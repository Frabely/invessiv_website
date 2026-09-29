import { sql } from "drizzle-orm";
import {
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import {
  ACTIVE_FEEDBACK_ROUND_STATUS_VALUES,
  FEEDBACK_ROUND_STATUS_VALUES,
  FeedbackRoundStatus,
  INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES,
} from "@invessiv/common/constants/crm/feedback-round-statuses";
import { FeedbackRoundsConstraintName as N } from "@invessiv/db/constraint-names/crm/feedback-rounds-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { portalMemberships } from "./portal-memberships";
import { projects } from "./projects";
import { workspaceMembers } from "./workspace-members";

const noteMaxLength = sql.raw(String(FEEDBACK_LIMITS.noteMaxLength));

/**
 * One feedback round of one project, created by the team at handover. `customer_id` is
 * denormalized for portal filters and bound to the project by the composite key. Portal
 * memberships may vanish (`SET NULL`); the timestamps next to them stay.
 */
export const feedbackRounds = pgTable(
  "feedback_rounds",
  {
    id: uuid("id").primaryKey(),
    project_id: uuid("project_id").notNull(),
    customer_id: uuid("customer_id").notNull(),
    round_number: integer("round_number").notNull(),
    status: text("status", { enum: FEEDBACK_ROUND_STATUS_VALUES }).notNull(),
    preview_url: text("preview_url"),
    handover_note: text("handover_note"),
    due_on: date("due_on"),
    area_options: text("area_options").array().notNull(),
    handed_over_by_member_id: uuid("handed_over_by_member_id").notNull(),
    handed_over_at: timestamp("handed_over_at", {
      withTimezone: true,
    }).notNull(),
    draft_updated_at: timestamp("draft_updated_at", { withTimezone: true }),
    draft_updated_by_portal_membership_id: uuid(
      "draft_updated_by_portal_membership_id",
    ),
    submitted_at: timestamp("submitted_at", { withTimezone: true }),
    submitted_by_portal_membership_id: uuid(
      "submitted_by_portal_membership_id",
    ),
    customer_notice: text("customer_notice"),
    started_at: timestamp("started_at", { withTimezone: true }),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    completed_by_member_id: uuid("completed_by_member_id"),
    approved_at: timestamp("approved_at", { withTimezone: true }),
    approved_by_portal_membership_id: uuid("approved_by_portal_membership_id"),
    read_at: timestamp("read_at", { withTimezone: true }),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.ProjectCustomerForeignKey,
      columns: [t.project_id, t.customer_id],
      foreignColumns: [projects.id, projects.customer_id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.HandedOverByForeignKey,
      columns: [t.handed_over_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    foreignKey({
      name: N.DraftUpdatedByForeignKey,
      columns: [t.draft_updated_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }).onDelete("set null"),
    foreignKey({
      name: N.SubmittedByForeignKey,
      columns: [t.submitted_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }).onDelete("set null"),
    foreignKey({
      name: N.CompletedByForeignKey,
      columns: [t.completed_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    foreignKey({
      name: N.ApprovedByForeignKey,
      columns: [t.approved_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }).onDelete("set null"),
    unique(N.IdProjectUnique).on(t.id, t.project_id),
    unique(N.ProjectNumberUnique).on(t.project_id, t.round_number),
    check(
      N.RoundNumberCheck,
      sql`${t.round_number} between 1 and ${sql.raw(String(FEEDBACK_LIMITS.roundsPerProject))}`,
    ),
    check(N.StatusCheck, sqlCheckIn(t.status, FEEDBACK_ROUND_STATUS_VALUES)),
    check(
      N.PreviewUrlCheck,
      sql`${t.preview_url} like 'https://%' and length(${t.preview_url}) <= 2048`,
    ),
    check(
      N.HandoverNoteCheck,
      sql`length(${t.handover_note}) <= ${noteMaxLength}`,
    ),
    check(
      N.AreaOptionsCheck,
      sql`cardinality(${t.area_options}) <= ${sql.raw(String(FEEDBACK_LIMITS.areasPerProject))}`,
    ),
    check(
      N.CustomerNoticeCheck,
      sql`length(${t.customer_notice}) <= ${noteMaxLength}`,
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
    check(
      N.OpenUnsubmittedCheck,
      sql`${t.status} <> ${FeedbackRoundStatus.Open} or (${t.submitted_at} is null and ${t.submitted_by_portal_membership_id} is null)`,
    ),
    check(
      N.SubmittedCheck,
      sql`not (${sqlCheckIn(t.status, [
        FeedbackRoundStatus.Submitted,
        FeedbackRoundStatus.InDiscussion,
        FeedbackRoundStatus.InProgress,
        FeedbackRoundStatus.Completed,
      ])}) or ${t.submitted_at} is not null`,
    ),
    check(
      N.SubmittedByCheck,
      sql`${t.submitted_by_portal_membership_id} is null or ${t.submitted_at} is not null`,
    ),
    check(
      N.StartedCheck,
      sql`${t.status} <> ${FeedbackRoundStatus.InProgress} or ${t.started_at} is not null`,
    ),
    check(
      N.CompletedCheck,
      sql`${t.status} <> ${FeedbackRoundStatus.Completed} or (${t.completed_at} is not null and ${t.completed_by_member_id} is not null)`,
    ),
    check(
      N.CompletedAtCheck,
      sql`${t.completed_at} is null or ${sqlCheckIn(t.status, [
        FeedbackRoundStatus.Completed,
        FeedbackRoundStatus.Approved,
      ])}`,
    ),
    check(
      N.ApprovedCheck,
      sql`(${t.status} = ${FeedbackRoundStatus.Approved}) = (${t.approved_at} is not null)`,
    ),
    uniqueIndex(N.ActiveUnique)
      .on(t.project_id)
      .where(sqlCheckIn(t.status, ACTIVE_FEEDBACK_ROUND_STATUS_VALUES)),
    uniqueIndex(N.ApprovedUnique)
      .on(t.project_id)
      .where(sql`${t.status} = ${FeedbackRoundStatus.Approved}`),
    index(N.QueueIndex)
      .on(t.status, t.submitted_at)
      .where(sqlCheckIn(t.status, INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES)),
    index(N.UnreadIndex)
      .on(t.project_id)
      .where(
        sql`${t.status} = ${FeedbackRoundStatus.Submitted} and ${t.read_at} is null`,
      ),
  ],
);
