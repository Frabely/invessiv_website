import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { ONBOARDING_CATALOG_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-catalog-statuses";
import { ONBOARDING_LIMITS } from "@invessiv/common/constants/crm/onboarding/onboarding-limits";
import { OnboardingTemplatesConstraintName as N } from "@invessiv/db/constraint-names/crm/onboarding-templates-constraint-names";
import { sqlCheckIn, sqlLimit } from "@invessiv/db/core";

/** An ordered selection of catalog blocks. The title is internal and therefore not translated. */
export const onboardingTemplates = pgTable(
  "onboarding_templates",
  {
    id: uuid("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status", {
      enum: ONBOARDING_CATALOG_STATUS_VALUES,
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
      sql`btrim(${t.title}) <> '' and length(${t.title}) <= ${sqlLimit(ONBOARDING_LIMITS.titleMaxLength)}`,
    ),
    check(
      N.DescriptionCheck,
      sql`length(${t.description}) <= ${sqlLimit(ONBOARDING_LIMITS.templateDescriptionMaxLength)}`,
    ),
    check(
      N.StatusCheck,
      sqlCheckIn(t.status, ONBOARDING_CATALOG_STATUS_VALUES),
    ),
    check(N.VersionCheck, sql`${t.version} > 0`),
  ],
);
