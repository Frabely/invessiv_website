import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { FEEDBACK_ITEM_KIND_VALUES } from "@invessiv/common/constants/crm/feedback-item-kinds";
import {
  FEEDBACK_ITEM_RESULT_VALUES,
  FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE,
} from "@invessiv/common/constants/crm/feedback-item-results";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { FeedbackRoundItemsConstraintName as N } from "@invessiv/db/constraint-names/crm/feedback-round-items-constraint-names";
import { sqlCheckIn } from "@invessiv/db/core";
import { feedbackRounds } from "./feedback-rounds";
import { portalMemberships } from "./portal-memberships";
import { workspaceMembers } from "./workspace-members";

/**
 * One point of customer feedback. The id comes from the client so it stays stable across autosaves.
 * `area_label` is a snapshot out of the round's `area_options`, not a key; null means "general".
 * The body may be empty while drafting; submitting requires text in every item.
 */
export const feedbackRoundItems = pgTable(
  "feedback_round_items",
  {
    id: uuid("id").primaryKey(),
    round_id: uuid("round_id").notNull(),
    position: integer("position").notNull(),
    area_label: text("area_label"),
    kind: text("kind", { enum: FEEDBACK_ITEM_KIND_VALUES }),
    body: text("body").notNull(),
    created_by_portal_membership_id: uuid("created_by_portal_membership_id"),
    result: text("result", { enum: FEEDBACK_ITEM_RESULT_VALUES }),
    result_note: text("result_note"),
    result_set_by_member_id: uuid("result_set_by_member_id"),
    result_set_at: timestamp("result_set_at", { withTimezone: true }),
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
      name: N.RoundForeignKey,
      columns: [t.round_id],
      foreignColumns: [feedbackRounds.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.CreatedByForeignKey,
      columns: [t.created_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }).onDelete("set null"),
    foreignKey({
      name: N.ResultSetByForeignKey,
      columns: [t.result_set_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    unique(N.IdRoundUnique).on(t.id, t.round_id),
    // DEFERRABLE INITIALLY IMMEDIATE in the migration; Drizzle cannot express it. A draft reorder
    // defers it for its own transaction to swap positions.
    unique(N.RoundPositionUnique).on(t.round_id, t.position),
    check(
      N.PositionCheck,
      sql`${t.position} >= 0 and ${t.position} < ${sql.raw(String(FEEDBACK_LIMITS.itemsPerRound))}`,
    ),
    check(
      N.AreaLabelCheck,
      sql`${t.area_label} is null or (btrim(${t.area_label}) <> '' and length(${t.area_label}) <= ${sql.raw(String(FEEDBACK_LIMITS.areaLabelMaxLength))})`,
    ),
    check(N.KindCheck, sqlCheckIn(t.kind, FEEDBACK_ITEM_KIND_VALUES)),
    check(
      N.BodyCheck,
      sql`length(${t.body}) <= ${sql.raw(String(FEEDBACK_LIMITS.itemBodyMaxLength))}`,
    ),
    check(N.ResultCheck, sqlCheckIn(t.result, FEEDBACK_ITEM_RESULT_VALUES)),
    check(
      N.ResultNoteLengthCheck,
      sql`length(${t.result_note}) <= ${sql.raw(String(FEEDBACK_LIMITS.noteMaxLength))}`,
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
    check(
      N.ResultFieldsCheck,
      sql`num_nonnulls(${t.result}, ${t.result_set_by_member_id}, ${t.result_set_at}) in (0, 3)`,
    ),
    check(
      N.ResultNoteCheck,
      sql`${t.result_note} is null or ${t.result} is not null`,
    ),
    check(
      N.ResultReplyCheck,
      sql`${t.result} is null or not (${sqlCheckIn(t.result, FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE)}) or btrim(coalesce(${t.result_note}, '')) <> ''`,
    ),
  ],
);
