import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@invessiv/db/record-configuration";
import { getDatabaseUrl } from "./env";

let cachedClient: ReturnType<typeof neon> | null = null;
let cachedClientConnectionString: string | null = null;

function createDrizzleDatabaseClient(databaseUrl: string) {
  return drizzle({
    connection: databaseUrl,
    schema,
  });
}

type DrizzleDatabaseClient = ReturnType<typeof createDrizzleDatabaseClient>;
let cachedDrizzleClient: DrizzleDatabaseClient | null = null;
let cachedDrizzleConnectionString: string | null = null;

export function hasDatabaseConnectionString() {
  return Boolean(getDatabaseUrl());
}

export function getDatabaseClient() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!cachedClient || cachedClientConnectionString !== databaseUrl) {
    cachedClient = neon(databaseUrl);
    cachedClientConnectionString = databaseUrl;
  }

  return cachedClient;
}

export type ContactDatabase = ReturnType<typeof getDrizzleDatabaseClient>;
export type ContactDatabaseTransaction = Parameters<
  Parameters<ContactDatabase["transaction"]>[0]
>[0];

export function getDrizzleDatabaseClient() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!cachedDrizzleClient || cachedDrizzleConnectionString !== databaseUrl) {
    cachedDrizzleClient = createDrizzleDatabaseClient(databaseUrl);
    cachedDrizzleConnectionString = databaseUrl;
  }

  return cachedDrizzleClient;
}
