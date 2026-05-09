import { describe, expect, it } from "vitest";
import { loadLocalEnvFiles } from "@/server/config/load-env";
import {
  getDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/core";
import { getTableConfig } from "drizzle-orm/pg-core";
import { leadActivities } from "@/server/db/record-configuration/lead-activities";
import { leadCallContacts } from "@/server/db/record-configuration/lead-call-contacts";
import { leadCategories } from "@/server/db/record-configuration/lead-categories";
import { leadEmailContacts } from "@/server/db/record-configuration/lead-email-contacts";
import { leadProjectRequests } from "@/server/db/record-configuration/lead-project-requests";
import { leadSocialProfiles } from "@/server/db/record-configuration/lead-social-profiles";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";
import { leads } from "@/server/db/record-configuration/leads";

type SchemaColumnRow = {
  columnName: string;
  ordinalPosition: number;
  tableName: string;
};

const EXCLUDED_DATABASE_TABLES = new Set(["playing_with_neon"]);
const CONTACT_TABLE_SCHEMAS = [
  leads,
  leadCategories,
  leadSubmissions,
  leadProjectRequests,
  leadEmailContacts,
  leadCallContacts,
  leadSocialProfiles,
  leadActivities,
];

function getColumnsForTable(rows: SchemaColumnRow[], tableName: string) {
  return rows
    .filter((row) => row.tableName === tableName)
    .map((row) => row.columnName)
    .sort();
}

describe("contact DB table shapes", () => {
  it("matches the live database schema columns for all contact tables", async () => {
    loadLocalEnvFiles();

    expect(
      hasDatabaseConnectionString(),
      "DATABASE_URL is not configured for the DB schema contract test.",
    ).toBe(true);

    const expectedTables = CONTACT_TABLE_SCHEMAS.map(
      (table) => getTableConfig(table).name,
    ).sort((left, right) => left.localeCompare(right));
    const expectedColumnsByTable = new Map(
      CONTACT_TABLE_SCHEMAS.map((table) => {
        const tableConfig = getTableConfig(table);

        return [
          tableConfig.name,
          tableConfig.columns.map((column) => column.name).sort(),
        ] as const;
      }),
    );
    const sql = getDatabaseClient();
    const rows = (await sql`
      SELECT
        table_name AS "tableName",
        column_name AS "columnName",
        ordinal_position AS "ordinalPosition"
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name <> 'schema_migrations'
      ORDER BY table_name, ordinal_position
    `) as SchemaColumnRow[];
    const actualTables = [
      ...new Set(
        rows
          .map((row) => row.tableName)
          .filter((tableName) => !EXCLUDED_DATABASE_TABLES.has(tableName)),
      ),
    ].sort((left, right) => left.localeCompare(right));
    const missingTables = expectedTables.filter(
      (tableName) => !actualTables.includes(tableName),
    );
    const unexpectedTables = actualTables.filter(
      (tableName) => !expectedTables.includes(tableName),
    );

    expect(
      missingTables,
      "Contact tables are missing in the live database.",
    ).toEqual([]);
    expect(
      unexpectedTables,
      "Live database tables exist without a matching contact schema table.",
    ).toEqual([]);

    for (const table of CONTACT_TABLE_SCHEMAS) {
      const tableName = getTableConfig(table).name;

      expect(getColumnsForTable(rows, tableName)).toEqual(
        expectedColumnsByTable.get(tableName),
      );
    }
  });
});
