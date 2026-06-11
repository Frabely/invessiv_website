import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabaseClient } from "@invessiv/db/core";
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

  const sql = getDatabaseClient();

  console.log(`Dropping ${target} schema public...`);
  await sql.query("DROP SCHEMA IF EXISTS public CASCADE");
  await sql.query("CREATE SCHEMA public");

  console.log(`Re-running ${target} migrations...`);
  execFileSync(
    process.execPath,
    [getLocalTsxBinaryPath(), getRunMigrationsScriptPath(), target],
    {
      stdio: "inherit",
    },
  );
}

runReset().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
