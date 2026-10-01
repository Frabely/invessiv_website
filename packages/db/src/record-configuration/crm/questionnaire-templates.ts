import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { QUESTIONNAIRE_CATALOG_STATUS_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { QuestionnaireTemplatesConstraintName as N } from "@invessiv/db/constraint-names/crm/questionnaire-templates-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";

/** An ordered selection of catalog blocks. The title is internal and therefore not translated. */
export const questionnaireTemplates = pgTable(
  "questionnaire_templates",
  {
    id: uuid("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", {
      enum: QUESTIONNAIRE_CATALOG_STATUS_VALUES,
    }).notNull(),
    version: integer("version").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      N.TitleCheck,
      sql`btrim(${t.title}) <> '' and length(${t.title}) <= ${sqlLimit(QUESTIONNAIRE_LIMITS.titleMaxLength)}`,
    ),
    check(
      N.DescriptionCheck,
      sql`length(${t.description}) <= ${sqlLimit(QUESTIONNAIRE_LIMITS.templateDescriptionMaxLength)}`,
    ),
    check(
      N.StatusCheck,
      sqlCheckIn(t.status, QUESTIONNAIRE_CATALOG_STATUS_VALUES),
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
  ],
);
