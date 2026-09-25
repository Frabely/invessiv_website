import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { parse } from "dotenv";

function readRequiredEnv(file) {
  if (!existsSync(file)) {
    throw new Error(
      `Portal E2E requires ${path.basename(file)} for database comparison.`,
    );
  }
  const values = parse(readFileSync(file, "utf8"));
  if (!values.DATABASE_URL?.trim()) {
    throw new Error(
      `Portal E2E requires DATABASE_URL in ${path.basename(file)}.`,
    );
  }
  return values;
}

/** Compare the actual database endpoint, ignoring credentials and pooler/query variants. */
export function databaseIdentity(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Portal E2E requires valid PostgreSQL database URLs.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname ||
    !url.pathname ||
    url.pathname === "/"
  ) {
    throw new Error("Portal E2E requires valid PostgreSQL database URLs.");
  }
  const host = url.hostname.toLowerCase().replace(/-pooler(?=\.)/, "");
  return `${host}:${url.port || "5432"}${decodeURIComponent(url.pathname)}`;
}

export function loadPortalE2eEnvironment(appDirectory) {
  const rootDirectory = path.resolve(appDirectory, "../..");
  const allowedDatabaseFile = path.join(
    appDirectory,
    "e2e",
    "allowed-development-database.json",
  );
  if (!existsSync(allowedDatabaseFile)) {
    throw new Error(
      "Portal E2E requires an allowed development database identity.",
    );
  }
  const allowedDatabase = JSON.parse(readFileSync(allowedDatabaseFile, "utf8"));
  if (!/^[a-f0-9]{64}$/.test(allowedDatabase.identitySha256)) {
    throw new Error("Portal E2E has an invalid development database identity.");
  }
  const rootDevelopment = readRequiredEnv(
    path.join(rootDirectory, ".env.development.local"),
  );
  const appDevelopment = readRequiredEnv(
    path.join(appDirectory, ".env.development.local"),
  );
  const preview = readRequiredEnv(
    path.join(rootDirectory, ".env.preview.local"),
  );
  const production = readRequiredEnv(
    path.join(rootDirectory, ".env.production.local"),
  );
  const developmentIdentity = databaseIdentity(rootDevelopment.DATABASE_URL);
  const appIdentity = databaseIdentity(appDevelopment.DATABASE_URL);
  const previewIdentity = databaseIdentity(preview.DATABASE_URL);
  const productionIdentity = databaseIdentity(production.DATABASE_URL);
  const developmentHash = createHash("sha256")
    .update(developmentIdentity)
    .digest("hex");

  if (
    developmentHash !== allowedDatabase.identitySha256 ||
    developmentIdentity !== appIdentity ||
    developmentIdentity === previewIdentity ||
    developmentIdentity === productionIdentity
  ) {
    throw new Error(
      "Portal E2E requires the allowlisted development database in root and app env files, distinct from preview and production.",
    );
  }

  const development = { ...rootDevelopment, ...appDevelopment };
  if (
    !development.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_") ||
    !development.CLERK_SECRET_KEY?.startsWith("sk_test_")
  ) {
    throw new Error("Portal E2E requires Clerk development credentials.");
  }

  return {
    development,
    databaseUrl: appDevelopment.DATABASE_URL,
    publishableKey: development.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: development.CLERK_SECRET_KEY,
  };
}
