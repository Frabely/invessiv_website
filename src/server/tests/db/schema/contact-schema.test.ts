import { getTableConfig } from "drizzle-orm/pg-core";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { leadActivities } from "@invessiv/db/record-configuration/lead-activities";
import { leadCallContacts } from "@invessiv/db/record-configuration/lead-call-contacts";
import { leadCategories } from "@invessiv/db/record-configuration/lead-categories";
import { leadEmailContacts } from "@invessiv/db/record-configuration/lead-email-contacts";
import { leadProjectRequests } from "@invessiv/db/record-configuration/lead-project-requests";
import { leadSocialProfiles } from "@invessiv/db/record-configuration/lead-social-profiles";
import { leadSubmissions } from "@invessiv/db/record-configuration/lead-submissions";
import { leads } from "@invessiv/db/record-configuration/leads";

const CONTACT_TABLE_SCHEMAS = [
  { table: leads, tableName: "leads" },
  { table: leadCategories, tableName: "lead_categories" },
  { table: leadSubmissions, tableName: "lead_submissions" },
  { table: leadProjectRequests, tableName: "lead_project_requests" },
  { table: leadEmailContacts, tableName: "lead_email_contacts" },
  { table: leadCallContacts, tableName: "lead_call_contacts" },
  { table: leadSocialProfiles, tableName: "lead_social_profiles" },
  { table: leadActivities, tableName: "lead_activities" },
] as const;

const normalizeSql = (sql: string) => sql.replace(/\s+/g, " ").trim();

describe("contact drizzle schema", () => {
  it.each(CONTACT_TABLE_SCHEMAS)(
    "exposes the expected table config for $tableName",
    ({ table, tableName }) => {
      const tableConfig = getTableConfig(table);

      expect(tableConfig.name).toBe(tableName);
      expect(tableConfig.columns.length).toBeGreaterThan(0);
    },
  );

  it("keeps lead category ids application-owned and sort_order explicit", () => {
    const tableConfig = getTableConfig(leadCategories);
    const idColumn = tableConfig.columns.find((column) => column.name === "id");
    const sortOrderColumn = tableConfig.columns.find(
      (column) => column.name === "sort_order",
    );

    expect(idColumn).toMatchObject({ notNull: true, hasDefault: false });
    expect(sortOrderColumn).toMatchObject({
      notNull: true,
      hasDefault: false,
    });
  });

  it("keeps the lead category forward migration dropping implicit defaults", () => {
    const createMigrationSql = readFileSync(
      join(
        process.cwd(),
        "packages/db/migrations/0003_create_lead_categories.sql",
      ),
      "utf8",
    );
    const removeDefaultsMigrationSql = readFileSync(
      join(
        process.cwd(),
        "packages/db/migrations/0007_remove_lead_category_defaults.sql",
      ),
      "utf8",
    );

    const normalizedCreateMigrationSql = normalizeSql(createMigrationSql);
    const normalizedRemoveDefaultsMigrationSql = normalizeSql(
      removeDefaultsMigrationSql,
    );

    expect(normalizedCreateMigrationSql).toContain(
      "id UUID PRIMARY KEY DEFAULT",
    );
    expect(normalizedCreateMigrationSql).toContain(
      "sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0)",
    );
    expect(normalizedRemoveDefaultsMigrationSql).toContain(
      "ALTER COLUMN id DROP DEFAULT",
    );
    expect(normalizedRemoveDefaultsMigrationSql).toContain(
      "ALTER COLUMN sort_order DROP DEFAULT",
    );
  });
});
