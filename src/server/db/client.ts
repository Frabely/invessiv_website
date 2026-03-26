import "server-only";
import { neon } from "@neondatabase/serverless";
import { getServerEnv } from "@/server/config/env";

let cachedClient: ReturnType<typeof neon> | null = null;
let cachedConnectionString: string | null = null;

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
