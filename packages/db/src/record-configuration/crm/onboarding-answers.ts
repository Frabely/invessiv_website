import { sql } from "drizzle-orm";
import {
  check,
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
import { ONBOARDING_LIMITS } from "@invessiv/common/constants/crm/onboarding/onboarding-limits";
import { OnboardingAnswersConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-answers-constraint-names";
import { sqlLimit } from "@invessiv/db/core";
import { onboardingFieldChoices } from "./onboarding-field-choices";
import { onboardingFields } from "./onboarding-fields";
import { onboardingForms } from "./onboarding-forms";
import { onboardingGroupEntries } from "./onboarding-group-entries";
import { portalMemberships } from "./portal-memberships";
import { workspaceMembers } from "./workspace-members";

/**
 * Relational answers, no jsonb: a multi choice is one row per option. A row carries either a
 * `value` or a `choice_id`. Files, groups and the service confirmation never have rows here.
 * That the field belongs to the same form is checked by the write path.
 */
export const onboardingAnswers = pgTable(
  "onboarding_answers",
  {
    id: uuid("id").primaryKey(),
    form_id: uuid("form_id").notNull(),
    field_id: uuid("field_id").notNull(),
    group_entry_id: uuid("group_entry_id"),
    choice_id: uuid("choice_id"),
    value: text("value"),
    sort_order: integer("sort_order").notNull(),
    updated_by_portal_membership_id: uuid("updated_by_portal_membership_id"),
    updated_by_member_id: uuid("updated_by_member_id"),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.FormForeignKey,
      columns: [t.form_id],
      foreignColumns: [onboardingForms.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.FieldForeignKey,
      columns: [t.field_id],
      foreignColumns: [onboardingFields.id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.EntryFormForeignKey,
      columns: [t.group_entry_id, t.form_id],
      foreignColumns: [
        onboardingGroupEntries.id,
        onboardingGroupEntries.form_id,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: N.ChoiceFieldForeignKey,
      columns: [t.choice_id, t.field_id],
      foreignColumns: [
        onboardingFieldChoices.id,
        onboardingFieldChoices.field_id,
      ],
    }).onDelete("cascade"),
    foreignKey({
      name: N.UpdatedByPortalForeignKey,
      columns: [t.updated_by_portal_membership_id],
      foreignColumns: [portalMemberships.id],
    }).onDelete("set null"),
    foreignKey({
      name: N.UpdatedByMemberForeignKey,
      columns: [t.updated_by_member_id],
      foreignColumns: [workspaceMembers.id],
    }),
    unique(N.SlotUnique)
      .on(t.field_id, t.group_entry_id, t.sort_order)
      .nullsNotDistinct(),
    uniqueIndex(N.ChoiceBlockLevelUnique)
      .on(t.field_id, t.choice_id)
      .where(sql`${t.group_entry_id} is null and ${t.choice_id} is not null`),
    uniqueIndex(N.ChoiceGroupEntryUnique)
      .on(t.field_id, t.group_entry_id, t.choice_id)
      .where(
        sql`${t.group_entry_id} is not null and ${t.choice_id} is not null`,
      ),
    check(
      N.ValueCheck,
      sql`${t.value} is null or (btrim(${t.value}) <> '' and length(${t.value}) <= ${sqlLimit(ONBOARDING_LIMITS.storedValueMaxLength)})`,
    ),
    check(
      N.SortOrderCheck,
      sql`${t.sort_order} >= 0 and ${t.sort_order} < ${sqlLimit(ONBOARDING_LIMITS.storedPositionCeiling)}`,
    ),
    check(N.ContentCheck, sql`num_nonnulls(${t.value}, ${t.choice_id}) = 1`),
    check(
      N.UpdatedByCheck,
      sql`num_nonnulls(${t.updated_by_portal_membership_id}, ${t.updated_by_member_id}) <= 1`,
    ),
    index(N.FormIndex).on(t.form_id),
  ],
);
