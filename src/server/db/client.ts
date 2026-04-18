import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { getServerEnv } from "@/server/config/env";
import { leadCallContacts } from "@/server/db/record-configuration/lead-call-contacts";
import { leadEmailContacts } from "@/server/db/record-configuration/lead-email-contacts";
import { leadProjectRequests } from "@/server/db/record-configuration/lead-project-requests";
import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";
import { leads } from "@/server/db/record-configuration/leads";

let cachedClient: ReturnType<typeof neon> | null = null;
let cachedConnectionString: string | null = null;
const contactSchema = {
  leadCallContacts,
  leadEmailContacts,
  leadProjectRequests,
  leadSubmissions,
  leads,
};

function createDrizzleDatabaseClient(databaseUrl: string) {
  return drizzle({
    connection: databaseUrl,
    schema: contactSchema,
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
