import fs from "node:fs";
import path from "node:path";
import { parse as parseDotenv } from "dotenv";
import {
  DATABASE_TARGET_VALUES,
  type DatabaseTarget,
} from "@invessiv/common/constants/database/database-target";
import { findWorkspaceRoot, loadLocalEnvFiles } from "@invessiv/db/core/env";

export {
  DatabaseTarget,
  DATABASE_TARGET_VALUES as DATABASE_TARGETS,
} from "@invessiv/common/constants/database/database-target";

function isDatabaseTarget(value: string): value is DatabaseTarget {
  return DATABASE_TARGET_VALUES.includes(value as DatabaseTarget);
}

export function parseDatabaseTarget(argv: string[]): DatabaseTarget | null {
  const rawTarget = argv[2]?.trim().toLowerCase();
  if (!rawTarget) {
    return null;
  }

  if (!isDatabaseTarget(rawTarget)) {
    throw new Error(
      `Unknown database target "${rawTarget}". Use one of: ${DATABASE_TARGET_VALUES.join(", ")}.`,
    );
  }

  return rawTarget;
}

function resolveDatabaseUrlForTarget(target: DatabaseTarget): string | null {
  const envKeyByTarget: Record<DatabaseTarget, string> = {
    development: "DATABASE_URL_DEVELOPMENT",
    preview: "DATABASE_URL_PREVIEW",
    production: "DATABASE_URL_PRODUCTION",
  };

  return process.env[envKeyByTarget[target]]?.trim() || null;
}

function getTargetEnvFile(target: DatabaseTarget): string | null {
  const envFileByTarget: Record<DatabaseTarget, string | null> = {
    development: ".env.development.local",
    preview: ".env.preview.local",
    production: ".env.production.local",
  };

  return envFileByTarget[target];
}

export function readTargetEnvValue(
  target: DatabaseTarget,
  key: string,
): string | null {
  const envFile = getTargetEnvFile(target);
  if (!envFile) {
    return null;
  }

  const envFilePath = path.join(findWorkspaceRoot(process.cwd()), envFile);
  if (!fs.existsSync(envFilePath)) {
    return null;
  }

  const parsed = parseDotenv(fs.readFileSync(envFilePath, "utf8"));
  return parsed[key]?.trim() || null;
}

export function configureDatabaseUrlFromTarget(target: DatabaseTarget | null) {
  loadLocalEnvFiles();

  if (!target) {
    return;
  }

  const inheritedDatabaseUrl = process.env.DATABASE_URL?.trim() || null;
  const targetEnvDatabaseUrl = readTargetEnvValue(target, "DATABASE_URL");

  const databaseUrl =
    targetEnvDatabaseUrl ||
    resolveDatabaseUrlForTarget(target) ||
    inheritedDatabaseUrl;

  if (!databaseUrl) {
    throw new Error(
      `${target} database URL is not configured. Set DATABASE_URL in ${target === "development" ? ".env.development.local" : target === "preview" ? ".env.preview.local" : ".env.production.local or .env.local"} or provide DATABASE_URL_${target.toUpperCase()}.`,
    );
  }

  process.env.DATABASE_URL = databaseUrl;
}
