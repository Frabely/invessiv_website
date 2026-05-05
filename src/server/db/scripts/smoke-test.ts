import { getServerEnv } from "../../config/env";
import { getDatabaseClient } from "../core";
import { getContactTableNames } from "./contact-table-names";
import {
  configureDatabaseUrlFromTarget,
  parseDatabaseTarget,
} from "./database-target";

type DatabaseSummaryRow = {
  databaseName: string;
  migrationCount: number;
};

type TableNameRow = {
  tablename: string;
};

async function run() {
  configureDatabaseUrlFromTarget(parseDatabaseTarget(process.argv));
  const env = getServerEnv();

  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Add it locally and in Vercel before running the DB smoke test.",
    );
  }

  const sql = getDatabaseClient();
  const contactTableNames = getContactTableNames();
  const [databaseSummaryRows, actualTableRows] = (await Promise.all([
    sql`
      SELECT
        current_database() AS "databaseName",
        (SELECT COUNT(*)::int FROM schema_migrations) AS "migrationCount"
    `,
    sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `,
  ])) as [DatabaseSummaryRow[], TableNameRow[]];

  const [{ databaseName, migrationCount }] = databaseSummaryRows;

  const actualTableNames = actualTableRows.map((row) => row.tablename);

  const missingTables = contactTableNames.filter(
    (tableName) => !actualTableNames.includes(tableName),
  );

  if (missingTables.length > 0) {
    throw new Error(
      `Contact tables are missing: ${missingTables.join(", ")}. Run \`npm run db:migrate\` before \`npm run db:smoke\`.`,
    );
  }

  console.log("Database smoke test passed.");
  console.log(`Database: ${databaseName}`);
  console.log(`Applied migrations: ${migrationCount}`);
  console.log(`Tables: ${contactTableNames.join(", ")}`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
