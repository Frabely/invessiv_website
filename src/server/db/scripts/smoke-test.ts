import { getServerEnv } from "../../config/env";
import { getDatabaseClient } from "../client";

async function run() {
  const env = getServerEnv();

  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Add it locally and in Vercel before running the DB smoke test.",
    );
  }

  const sql = getDatabaseClient();
  const [
    { databaseName, leadProjectRequestsTable, leadsTable, migrationCount },
  ] = (await sql`
      SELECT
        current_database() AS "databaseName",
        to_regclass('public.leads')::text AS "leadsTable",
        to_regclass('public.lead_project_requests')::text AS "leadProjectRequestsTable",
        (SELECT COUNT(*)::int FROM schema_migrations) AS "migrationCount"
    `) as Array<{
      databaseName: string;
      leadProjectRequestsTable: string | null;
      leadsTable: string | null;
      migrationCount: number;
    }>;

  if (!leadsTable || !leadProjectRequestsTable) {
    throw new Error(
      "Lead tables are missing. Run `npm run db:migrate` before `npm run db:smoke`.",
    );
  }

  console.log("Database smoke test passed.");
  console.log(`Database: ${databaseName}`);
  console.log(`Applied migrations: ${migrationCount}`);
  console.log(`Tables: ${leadsTable}, ${leadProjectRequestsTable}`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
