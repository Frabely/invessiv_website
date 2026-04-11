import { getServerEnv } from "../../config/env";
import { getDatabaseClient } from "../client";
import {
  configureDatabaseUrlFromTarget,
  parseDatabaseTarget,
} from "./database-target";

async function run() {
  configureDatabaseUrlFromTarget(parseDatabaseTarget(process.argv));
  const env = getServerEnv();

  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Add it locally and in Vercel before running the DB smoke test.",
    );
  }

  const sql = getDatabaseClient();
  const [
    {
      databaseName,
      leadCallContactsTableCount,
      leadEmailContactsTableCount,
      leadProjectRequestsTableCount,
      leadSubmissionsTableCount,
      leadsTableCount,
      migrationCount,
    },
  ] = (await sql`
      SELECT
        current_database() AS "databaseName",
        COUNT(*) FILTER (WHERE tablename = 'leads')::int AS "leadsTableCount",
        COUNT(*) FILTER (WHERE tablename = 'lead_submissions')::int AS "leadSubmissionsTableCount",
        COUNT(*) FILTER (WHERE tablename = 'lead_project_requests')::int AS "leadProjectRequestsTableCount",
        COUNT(*) FILTER (WHERE tablename = 'lead_email_contacts')::int AS "leadEmailContactsTableCount",
        COUNT(*) FILTER (WHERE tablename = 'lead_call_contacts')::int AS "leadCallContactsTableCount",
        (SELECT COUNT(*)::int FROM schema_migrations) AS "migrationCount"
      FROM pg_tables
      WHERE schemaname = 'public'
    `) as Array<{
    databaseName: string;
    leadCallContactsTableCount: number;
    leadEmailContactsTableCount: number;
    leadProjectRequestsTableCount: number;
    leadSubmissionsTableCount: number;
    leadsTableCount: number;
    migrationCount: number;
  }>;

  if (
    !leadsTableCount ||
    !leadSubmissionsTableCount ||
    !leadProjectRequestsTableCount ||
    !leadEmailContactsTableCount ||
    !leadCallContactsTableCount
  ) {
    throw new Error(
      "Lead tables are missing. Run `npm run db:migrate` before `npm run db:smoke`.",
    );
  }

  console.log("Database smoke test passed.");
  console.log(`Database: ${databaseName}`);
  console.log(`Applied migrations: ${migrationCount}`);
  console.log(
    "Tables: leads, lead_submissions, lead_project_requests, lead_email_contacts, lead_call_contacts",
  );
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
