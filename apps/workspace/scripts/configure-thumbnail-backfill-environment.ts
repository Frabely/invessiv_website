import fs from "node:fs";
import path from "node:path";
import { parse } from "dotenv";
import { DatabaseTarget } from "@invessiv/common/constants/database/database-target";
import { StorageProvider } from "@invessiv/common/constants/storage/storage-options";
import { findWorkspaceRoot } from "@invessiv/db/core/env";

function readEnvironment(filename: string): Record<string, string> {
  return fs.existsSync(filename)
    ? parse(fs.readFileSync(filename, "utf8"))
    : {};
}

function databaseIdentity(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid database URL in backfill configuration.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Invalid database URL in backfill configuration.");
  // Neon pooled and direct URLs can address the same production database.
  return url.hostname.replace(/-pooler(?=\.)/, "") + url.pathname;
}

/** Resolves one explicit DB target; dev/preview may share Blob, but neither may use production. */
export function configureThumbnailBackfillEnvironment(
  target: DatabaseTarget,
  rootDirectory = findWorkspaceRoot(process.cwd()),
  environment: Record<string, string | undefined> = process.env,
): void {
  if (environment.VERCEL === "1" && environment.VERCEL_ENV !== target)
    throw new Error(
      "Backfill target does not match the current Vercel environment. Backfill refused.",
    );
  const appDirectory = path.join(rootDirectory, "apps", "workspace");
  const readTarget = (value: DatabaseTarget) => {
    const root = readEnvironment(
      path.join(rootDirectory, `.env.${value}.local`),
    );
    const app = readEnvironment(path.join(appDirectory, `.env.${value}.local`));
    const explicitUrl =
      environment[`DATABASE_URL_${value.toUpperCase()}`]?.trim();
    const isDeployedTarget =
      environment.VERCEL === "1" && environment.VERCEL_ENV === value;
    const urls = [
      explicitUrl,
      root.DATABASE_URL?.trim(),
      app.DATABASE_URL?.trim(),
      isDeployedTarget ? environment.DATABASE_URL?.trim() : undefined,
    ].filter((url): url is string => !!url);
    if (new Set(urls.map(databaseIdentity)).size > 1)
      throw new Error(
        `Conflicting ${value} database configurations. Backfill refused.`,
      );
    return {
      databaseUrl: urls[0],
      storage: isDeployedTarget ? environment : { ...root, ...app },
    };
  };
  const production = readTarget(DatabaseTarget.Production);
  const selected =
    target === DatabaseTarget.Production ? production : readTarget(target);
  if (!selected.databaseUrl || !production.databaseUrl)
    throw new Error(
      "Explicit target and production database URLs are required for the backfill safety check.",
    );
  if (
    target !== DatabaseTarget.Production &&
    databaseIdentity(selected.databaseUrl) ===
      databaseIdentity(production.databaseUrl)
  )
    throw new Error(
      "Non-production backfill points to the production database. Backfill refused.",
    );

  // Each target provides its own store and credentials; dev/preview may explicitly name the same store.
  const productionStorage = production.storage;
  const storage = selected.storage;
  const storeId = storage.BLOB_STORE_ID?.trim();
  const productionStoreId = productionStorage.BLOB_STORE_ID?.trim();
  if (!storeId)
    throw new Error(
      `Missing explicit ${target} Blob store ID. Set BLOB_STORE_ID in the target environment file.`,
    );
  const normalizeStore = (value: string) => value.replace(/^store_/, "");
  if (
    target !== DatabaseTarget.Production &&
    productionStoreId &&
    normalizeStore(storeId) === normalizeStore(productionStoreId)
  )
    throw new Error(
      "Non-production backfill points to production Blob storage. Backfill refused.",
    );
  const token = storage.BLOB_READ_WRITE_TOKEN?.trim();
  const oidc = storage.VERCEL_OIDC_TOKEN?.trim();
  if (!token && !oidc)
    throw new Error(`Missing ${target} Blob credentials. Backfill refused.`);
  // A read-write token selects its own store, independently of BLOB_STORE_ID.
  if (
    token &&
    normalizeStore(token.split("_")[3] ?? "") !== normalizeStore(storeId)
  )
    throw new Error("Blob token and store ID disagree. Backfill refused.");
  const provider =
    storage.STORAGE_PROVIDER?.trim() || StorageProvider.VercelBlob;
  if (provider !== StorageProvider.VercelBlob)
    throw new Error("Unsupported backfill storage provider.");

  // Do not mutate the process until every guard has passed. No inherited generic URL or credential survives.
  environment.DATABASE_URL = selected.databaseUrl;
  environment.STORAGE_PROVIDER = provider;
  environment.BLOB_STORE_ID = storeId;
  for (const [key, value] of [
    ["BLOB_READ_WRITE_TOKEN", token],
    ["VERCEL_OIDC_TOKEN", oidc],
  ] as const) {
    // Empty values also prevent the DB package's later dotenv load from restoring another target's credentials.
    environment[key] = value ?? "";
  }
}
