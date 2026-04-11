import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { loadLocalEnvFiles } from "../../config/load-env";

export const DATABASE_TARGETS = [
  "development",
  "preview",
  "production",
] as const;

export type DatabaseTarget = (typeof DATABASE_TARGETS)[number];

function isDatabaseTarget(value: string): value is DatabaseTarget {
  return DATABASE_TARGETS.includes(value as DatabaseTarget);
}

export function parseDatabaseTarget(argv: string[]): DatabaseTarget | null {
  const rawTarget = argv[2]?.trim().toLowerCase();
  if (!rawTarget) {
    return null;
  }

  if (!isDatabaseTarget(rawTarget)) {
    throw new Error(
      `Unknown database target "${rawTarget}". Use one of: ${DATABASE_TARGETS.join(", ")}.`,
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

function loadTargetEnvFile(target: DatabaseTarget) {
  const envFileByTarget: Record<DatabaseTarget, string | null> = {
    development: ".env.development.local",
    preview: ".env.preview.local",
    production: ".env.production.local",
  };

  const envFile = envFileByTarget[target];
  if (!envFile) {
    return;
  }

  loadDotenv({
    override: true,
    path: path.join(process.cwd(), envFile),
    quiet: true,
  });
}

export function configureDatabaseUrlFromTarget(target: DatabaseTarget | null) {
  loadLocalEnvFiles();

  if (!target) {
    return;
  }

  loadTargetEnvFile(target);

  const databaseUrl =
    process.env.DATABASE_URL?.trim() || resolveDatabaseUrlForTarget(target);

  if (!databaseUrl) {
    throw new Error(
      `${target} database URL is not configured. Set DATABASE_URL in ${target === "development" ? ".env.development.local" : target === "preview" ? ".env.preview.local" : ".env.production.local or .env.local"} or provide DATABASE_URL_${target.toUpperCase()}.`,
    );
  }

  process.env.DATABASE_URL = databaseUrl;
}
