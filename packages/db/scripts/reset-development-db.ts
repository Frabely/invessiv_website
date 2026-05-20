import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabaseClient } from "@invessiv/db/core";
import { configureDatabaseUrlFromTarget } from "./database-target";

function getLocalTsxBinaryPath() {
  return path.resolve("node_modules", "tsx", "dist", "cli.mjs");
}

function getRunMigrationsScriptPath() {
  const currentFilePath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFilePath), "run-migrations.ts");
}

async function runReset() {
  configureDatabaseUrlFromTarget("development");

  const sql = getDatabaseClient();

  console.log("Dropping development schema public...");
  await sql.query("DROP SCHEMA IF EXISTS public CASCADE");
  await sql.query("CREATE SCHEMA public");

  console.log("Re-running development migrations...");
  execFileSync(
    process.execPath,
    [getLocalTsxBinaryPath(), getRunMigrationsScriptPath(), "development"],
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
