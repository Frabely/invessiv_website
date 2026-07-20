import fs from "node:fs";
import path from "node:path";
import { parse as parseDotenv } from "dotenv";
import { eq } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { findWorkspaceRoot } from "@invessiv/db/core/env";
import { leadSocialProfiles } from "@invessiv/db/record-configuration";
import { normalizeLeadProfileUrl } from "@/server/workspace/leads/shared/lead-url-normalization-service";

const DATABASE_TARGETS = ["development", "preview", "production"] as const;
type DatabaseTarget = (typeof DATABASE_TARGETS)[number];

function isDatabaseTarget(value: string): value is DatabaseTarget {
  return (DATABASE_TARGETS as readonly string[]).includes(value);
}

function configureDatabaseUrlForTarget(argv: string[]) {
  const rawTarget = argv[2]?.trim().toLowerCase();
  if (!rawTarget) {
    return;
  }

  if (!isDatabaseTarget(rawTarget)) {
    throw new Error(
      `Unknown database target "${rawTarget}". Use one of: ${DATABASE_TARGETS.join(", ")}.`,
    );
  }

  const envFileByTarget: Record<DatabaseTarget, string> = {
    development: ".env.development.local",
    preview: ".env.preview.local",
    production: ".env.production.local",
  };

  const envFilePath = path.join(
    findWorkspaceRoot(process.cwd()),
    envFileByTarget[rawTarget],
  );
  if (!fs.existsSync(envFilePath)) {
    throw new Error(
      `Missing env file for target "${rawTarget}": ${envFilePath}`,
    );
  }

  const parsed = parseDotenv(fs.readFileSync(envFilePath, "utf8"));
  const databaseUrl = parsed.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(`DATABASE_URL not set in ${envFilePath}`);
  }

  process.env.DATABASE_URL = databaseUrl;
}

async function run() {
  configureDatabaseUrlForTarget(process.argv);

  const db = getDrizzleDatabaseClient();
  const rows = await db
    .select({
      id: leadSocialProfiles.id,
      profile_url: leadSocialProfiles.profile_url,
      normalized_url: leadSocialProfiles.normalized_url,
    })
    .from(leadSocialProfiles);

  let updatedCount = 0;
  const failures: Array<{ id: string; reason: string }> = [];

  for (const row of rows) {
    const recomputed = normalizeLeadProfileUrl(row.profile_url);
    if (recomputed === row.normalized_url) {
      continue;
    }

    try {
      await db
        .update(leadSocialProfiles)
        .set({ normalized_url: recomputed, updated_at: new Date() })
        .where(eq(leadSocialProfiles.id, row.id));
      updatedCount += 1;
    } catch (error) {
      // Keep going: a single failing row (e.g. a would-be unique-index
      // collision) must not abort the whole backfill and leave it partial.
      const reason = error instanceof Error ? error.message : String(error);
      failures.push({ id: row.id, reason });
    }
  }

  console.log(
    `Backfill complete: ${updatedCount} of ${rows.length} normalized_url values updated.`,
  );

  if (failures.length > 0) {
    console.error(
      `Backfill finished with ${failures.length} failed row(s) — resolve these manually:`,
    );
    for (const failure of failures) {
      console.error(`  - ${failure.id}: ${failure.reason}`);
    }
    process.exitCode = 1;
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
