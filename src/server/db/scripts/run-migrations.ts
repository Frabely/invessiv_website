import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getServerEnv } from "../../config/env";
import { getDatabaseClient } from "../core";
import {
  configureDatabaseUrlFromTarget,
  parseDatabaseTarget,
} from "./database-target";

const MIGRATION_SPLIT_MARKER = /^-->\s*statement-breakpoint\s*$/gm;

async function ensureMigrationsTable() {
  const sql = getDatabaseClient();

  await sql.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

function getMigrationsDirectory() {
  const currentFilePath = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFilePath), "../migrations");
}

async function listMigrationFiles() {
  const migrationsDirectory = getMigrationsDirectory();
  const entries = await fs.readdir(migrationsDirectory, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function readAppliedMigrations() {
  const sql = getDatabaseClient();
  const rows = (await sql`
    SELECT filename
    FROM schema_migrations
    ORDER BY filename ASC
  `) as Array<{ filename: string }>;

  return new Set(rows.map((row) => row.filename));
}

function splitMigrationStatements(contents: string) {
  return contents
    .split(MIGRATION_SPLIT_MARKER)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function applyMigration(filename: string) {
  const sql = getDatabaseClient();
  const migrationPath = path.join(getMigrationsDirectory(), filename);
  const contents = await fs.readFile(migrationPath, "utf8");
  const statements = splitMigrationStatements(contents);

  for (const statement of statements) {
    await sql.query(statement);
  }

  await sql`
    INSERT INTO schema_migrations (filename)
    VALUES (${filename})
  `;

  console.log(`Applied migration: ${filename}`);
}

async function run() {
  configureDatabaseUrlFromTarget(parseDatabaseTarget(process.argv));
  const env = getServerEnv();

  if (!env.databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Add it locally and in Vercel before running migrations.",
    );
  }

  await ensureMigrationsTable();

  const [migrationFiles, appliedMigrations] = await Promise.all([
    listMigrationFiles(),
    readAppliedMigrations(),
  ]);

  for (const migrationFile of migrationFiles) {
    if (appliedMigrations.has(migrationFile)) {
      console.log(`Skipping already applied migration: ${migrationFile}`);
      continue;
    }

    await applyMigration(migrationFile);
  }

  console.log("Database migrations are up to date.");
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
