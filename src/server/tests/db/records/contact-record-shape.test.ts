import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { loadLocalEnvFiles } from "@/server/config/load-env";
import {
  getDatabaseClient,
  hasDatabaseConnectionString,
} from "@/server/db/client";
import type { DatabaseRecordDefinition } from "@/server/db/records/shared/database-record-definition";

type SchemaColumnRow = {
  columnName: string;
  ordinalPosition: number;
  tableName: string;
};

type RecordModule = {
  DATABASE_RECORD_DEFINITION?: DatabaseRecordDefinition<
    Record<string, unknown>,
    string,
    readonly string[]
  >;
};

const EXCLUDED_DATABASE_TABLES = new Set(["playing_with_neon"]);

function collectRecordFiles(relativePath: string): string[] {
  const directoryEntries = readdirSync(relativePath, {
    recursive: true,
    withFileTypes: true,
  });

  return directoryEntries
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((filePath) => filePath.endsWith("-record.ts"))
    .filter((filePath) => !filePath.endsWith("timestamped-record.ts"));
}

async function loadRecordSchemas() {
  const recordsDirectory = join(process.cwd(), "src/server/db/records");
  const recordFiles = collectRecordFiles(recordsDirectory);
  const recordModules = await Promise.all(
    recordFiles.map(async (filePath) => {
      const recordModule = (await import(
        pathToFileURL(filePath).href
      )) as RecordModule;
      return recordModule.DATABASE_RECORD_DEFINITION ?? null;
    }),
  );

  return recordModules.filter(
    (
      schema,
    ): schema is DatabaseRecordDefinition<
      Record<string, unknown>,
      string,
      readonly string[]
    > => schema !== null,
  );
}

function getColumnsForTable(rows: SchemaColumnRow[], tableName: string) {
  return rows
    .filter((row) => row.tableName === tableName)
    .sort((left, right) => left.ordinalPosition - right.ordinalPosition)
    .map((row) => row.columnName);
}

describe("contact DB record shapes", () => {
  it("matches the live database schema columns for all record-defined tables", async () => {
    loadLocalEnvFiles();

    expect(
      hasDatabaseConnectionString(),
      "DATABASE_URL is not configured for the DB schema contract test.",
    ).toBe(true);

    const recordSchemas = await loadRecordSchemas();
    const expectedTables = recordSchemas
      .map((schema) => schema.tableName)
      .sort((left, right) => left.localeCompare(right));
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
      "Record definitions exist for tables that are missing in the live database.",
    ).toEqual([]);
    expect(
      unexpectedTables,
      "Live database tables exist without a matching record definition.",
    ).toEqual([]);

    for (const schema of recordSchemas) {
      expect(getColumnsForTable(rows, schema.tableName)).toEqual(
        schema.columns,
      );
    }
  });
});
