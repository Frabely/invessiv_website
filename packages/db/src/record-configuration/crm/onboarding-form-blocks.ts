import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import {
  ONBOARDING_BLOCK_REVIEW_STATUS_VALUES,
  OnboardingBlockReviewStatus,
} from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { ONBOARDING_CLARIFICATION_MODE_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { OnboardingFormBlocksConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-form-blocks-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";
import { questionnaireBlocks } from "./questionnaire-blocks";
import { onboardingForms } from "./onboarding-forms";
import { workspaceMembers } from "./workspace-members";

/**
 * A block as a step of a form, with the team's review of it. The composite key binds the step to
 * a block owned by the same form, so a catalog block can never become a step.
 */
export const onboardingFormBlocks = pgTable(
  "onboarding_form_blocks",
  {
    form_id: uuid("form_id").notNull(),
    block_id: uuid("block_id").notNull(),
    position: integer("position").notNull(),
    review_status: text("review_status", {
      enum: ONBOARDING_BLOCK_REVIEW_STATUS_VALUES,
    }).notNull(),
    clarification_mode: text("clarification_mode", {
      enum: ONBOARDING_CLARIFICATION_MODE_VALUES,
    }),
    review_note: text("review_note"),
    reviewed_by_member_id: uuid("reviewed_by_member_id"),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    version: integer("version").notNull(),
  },
  (t) => [
    primaryKey({ name: N.PrimaryKey, columns: [t.form_id, t.block_id] }),
    foreignKey({
      name: N.FormForeignKey,
      columns: [t.form_id],
      foreignColumns: [onboardingForms.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.BlockOwnerForeignKey,
      columns: [t.block_id, t.form_id],
      foreignColumns: [
        questionnaireBlocks.id,
        questionnaireBlocks.owner_form_id,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: N.ReviewedByForeignKey,
      columns: [t.reviewed_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    // DEFERRABLE INITIALLY IMMEDIATE in the migration; Drizzle cannot express it.
    unique(N.PositionUnique).on(t.form_id, t.position),
    check(
      N.PositionCheck,
      sql`${t.position} >= 0 and ${t.position} < ${sqlLimit(QUESTIONNAIRE_LIMITS.storedPositionCeiling)}`,
    ),
    check(
      N.ReviewStatusCheck,
      sqlCheckIn(t.review_status, ONBOARDING_BLOCK_REVIEW_STATUS_VALUES),
    ),
    check(
      N.ClarificationModeCheck,
      sqlCheckIn(t.clarification_mode, ONBOARDING_CLARIFICATION_MODE_VALUES),
    ),
    check(
      N.ReviewNoteCheck,
      sql`length(${t.review_note}) <= ${sqlLimit(QUESTIONNAIRE_LIMITS.noteMaxLength)}`,
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
    check(
      N.ClarificationCheck,
      sql`(${t.review_status} = ${OnboardingBlockReviewStatus.Clarification}) = (${t.clarification_mode} is not null)`,
    ),
    check(
      N.ReviewedCheck,
      sql`${t.review_status} = ${OnboardingBlockReviewStatus.Pending} or (${t.reviewed_by_member_id} is not null and ${t.reviewed_at} is not null)`,
    ),
    check(
      N.ClarificationNoteCheck,
      sql`${t.clarification_mode} is null or btrim(coalesce(${t.review_note}, '')) <> ''`,
    ),
  ],
);
