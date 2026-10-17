import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { count, sql } from "drizzle-orm";
import { getDatabaseClient, getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers } from "@invessiv/db/record-configuration";
import { configureDatabaseUrlFromTarget } from "./database-target";

const RESETTABLE_DATABASE_TARGETS = ["development", "preview"] as const;

type ResettableDatabaseTarget = (typeof RESETTABLE_DATABASE_TARGETS)[number];

function isResettableDatabaseTarget(
  value: string,
): value is ResettableDatabaseTarget {
  return RESETTABLE_DATABASE_TARGETS.includes(
    value as ResettableDatabaseTarget,
  );
}

function parseResettableDatabaseTarget(
  argv: string[],
): ResettableDatabaseTarget {
  const rawTarget = argv[2]?.trim().toLowerCase() ?? "development";

  if (!isResettableDatabaseTarget(rawTarget)) {
    throw new Error(
      `Unknown reset target "${rawTarget}". Use one of: ${RESETTABLE_DATABASE_TARGETS.join(", ")}.`,
    );
  }

  return rawTarget;
}

function getLocalTsxBinaryPath() {
  return path.resolve("node_modules", "tsx", "dist", "cli.mjs");
}

function getRunMigrationsScriptPath() {
  const currentFilePath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFilePath), "run-migrations.ts");
}

async function runReset() {
  const target = parseResettableDatabaseTarget(process.argv);
  configureDatabaseUrlFromTarget(target);

  const client = getDatabaseClient();

  console.log(`Dropping ${target} schema public...`);
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");

  console.log(`Re-running ${target} migrations...`);
  execFileSync(
    process.execPath,
    [getLocalTsxBinaryPath(), getRunMigrationsScriptPath(), target],
    {
      stdio: "inherit",
    },
  );

  await getDrizzleDatabaseClient().transaction(async (tx) => {
    await tx.execute(sql`LOCK TABLE ${customers} IN SHARE ROW EXCLUSIVE MODE`);
    const [row] = await tx.select({ total: count() }).from(customers);
    if (!row || row.total !== 0) {
      throw new Error(
        "Cannot restart customer numbering after reset: customers table is not empty.",
      );
    }
    await tx.execute(
      sql`ALTER SEQUENCE public.customers_customer_number_seq RESTART WITH 1`,
    );
  });
  console.log(`Reset ${target} customer numbering: next customer is K0001.`);
}

runReset().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
