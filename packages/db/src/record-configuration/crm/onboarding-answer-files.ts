import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { ONBOARDING_LIMITS } from "@invessiv/common/constants/crm/onboarding/onboarding-limits";
import { OnboardingAnswerFilesConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-answer-files-constraint-names";
import { sqlLimit } from "@invessiv/db/core";
import { files } from "./files";
import { onboardingFields } from "./onboarding-fields";
import { onboardingForms } from "./onboarding-forms";
import { onboardingGroupEntries } from "./onboarding-group-entries";

/**
 * Links a file entry to a files field. A link table instead of columns on `files` because the
 * pre-fill attaches the same file to a second form. Deleting a bound file is blocked by the file
 * delete path while the form is not completed.
 */
export const onboardingAnswerFiles = pgTable(
  "onboarding_answer_files",
  {
    id: uuid("id").primaryKey(),
    form_id: uuid("form_id").notNull(),
    field_id: uuid("field_id").notNull(),
    group_entry_id: uuid("group_entry_id"),
    file_id: uuid("file_id").notNull(),
    position: integer("position").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
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
      name: N.FileForeignKey,
      columns: [t.file_id],
      foreignColumns: [files.id],
    }).onDelete("cascade"),
    unique(N.SlotUnique)
      .on(t.field_id, t.group_entry_id, t.file_id)
      .nullsNotDistinct(),
    check(
      N.PositionCheck,
      sql`${t.position} >= 0 and ${t.position} < ${sqlLimit(ONBOARDING_LIMITS.storedPositionCeiling)}`,
    ),
    index(N.FileIndex).on(t.file_id),
  ],
);
