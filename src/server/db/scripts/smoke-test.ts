import { getServerEnv } from "../../config/env";
import { loadLocalEnvFiles } from "../../config/load-env";
import { getDatabaseClient } from "../client";

async function run() {
  loadLocalEnvFiles();
  const env = getServerEnv();

  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Add it locally and in Vercel before running the DB smoke test.",
    );
  }

  const sql = getDatabaseClient();
  const [
    { databaseName, leadProjectRequestsTableCount, leadsTableCount, migrationCount },
  ] = (await sql`
      SELECT
        current_database() AS "databaseName",
        COUNT(*) FILTER (WHERE tablename = 'leads')::int AS "leadsTableCount",
        COUNT(*) FILTER (WHERE tablename = 'lead_project_requests')::int AS "leadProjectRequestsTableCount",
        (SELECT COUNT(*)::int FROM schema_migrations) AS "migrationCount"
      FROM pg_tables
      WHERE schemaname = 'public'
    `) as Array<{
      databaseName: string;
      leadProjectRequestsTableCount: number;
      leadsTableCount: number;
      migrationCount: number;
    }>;

  if (!leadsTableCount || !leadProjectRequestsTableCount) {
    throw new Error(
      "Lead tables are missing. Run `npm run db:migrate` before `npm run db:smoke`.",
    );
  }

  console.log("Database smoke test passed.");
  console.log(`Database: ${databaseName}`);
  console.log(`Applied migrations: ${migrationCount}`);
  console.log("Tables: leads, lead_project_requests");
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
