import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { getServerEnv } from "@/server/config/env";
import * as schema from "@/server/db/record-configuration";

let cachedClient: ReturnType<typeof neon> | null = null;
let cachedConnectionString: string | null = null;

function createDrizzleDatabaseClient(databaseUrl: string) {
  return drizzle({
    connection: databaseUrl,
    schema,
  });
}

type DrizzleDatabaseClient = ReturnType<typeof createDrizzleDatabaseClient>;
let cachedDrizzleClient: DrizzleDatabaseClient | null = null;

export function hasDatabaseConnectionString() {
  return Boolean(getServerEnv().databaseUrl);
}

export function getDatabaseClient() {
  const { databaseUrl } = getServerEnv();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!cachedClient || cachedConnectionString !== databaseUrl) {
    cachedClient = neon(databaseUrl);
    cachedConnectionString = databaseUrl;
  }

  return cachedClient;
}

export type ContactDatabase = ReturnType<typeof getDrizzleDatabaseClient>;
export type ContactDatabaseTransaction = Parameters<
  Parameters<ContactDatabase["transaction"]>[0]
>[0];

export function getDrizzleDatabaseClient() {
  const { databaseUrl } = getServerEnv();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!cachedDrizzleClient || cachedConnectionString !== databaseUrl) {
    cachedDrizzleClient = createDrizzleDatabaseClient(databaseUrl);
    cachedConnectionString = databaseUrl;
  }

  return cachedDrizzleClient;
}
