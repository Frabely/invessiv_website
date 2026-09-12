import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers, workspaceMembers } from "@invessiv/db/record-configuration";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.CRM_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:update-versioned:";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;
type CustomerRow = typeof customers.$inferSelect;

function toCurrentDto(row: CustomerRow) {
  return { id: row.id, city: row.city, version: row.version };
}

describe.skipIf(!RUN_INTEGRATION)(
  "updateVersioned PostgreSQL integration",
  () => {
    const memberId = randomUUID();
    const customerId = randomUUID();
    let db: Database | null = null;

    beforeAll(async () => {
      const workspaceRoot = findWorkspaceRoot(process.cwd());
      const loaded = loadDotenv({
        path: path.join(workspaceRoot, ".env.development.local"),
        quiet: true,
      });
      const databaseUrl =
        process.env.DATABASE_URL_DEVELOPMENT?.trim() ||
        loaded.parsed?.DATABASE_URL?.trim();

      if (!databaseUrl) {
        throw new Error(
          "Development database URL is not configured for the CRM integration test.",
        );
      }

      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();

      await db.insert(workspaceMembers).values({
        id: memberId,
        clerk_user_id: `${FIXTURE_PREFIX}${memberId}`,
        email: `${FIXTURE_PREFIX}${memberId}@example.test`,
        role: "owner",
        active: true,
        credentials_access: false,
        version: 1,
      });
      await db.insert(customers).values({
        id: customerId,
        customer_type: "company",
        display_name: `${FIXTURE_PREFIX}customer`,
        status: "active",
        owner_member_id: memberId,
        version: 1,
      });
    }, 30_000);

    afterAll(async () => {
      if (!db) {
        return;
      }

      await db.delete(customers).where(eq(customers.id, customerId));
      await db
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.id, memberId));
    }, 30_000);

    it("allows exactly one concurrent writer and returns the complete current state", async () => {
      if (!db) {
        throw new Error("Database was not initialized.");
      }

      const write = (city: string) =>
        db!.transaction((tx) =>
          updateVersioned({
            tx,
            table: customers,
            id: customerId,
            expectedVersion: 1,
            patch: { city },
            toDto: toCurrentDto,
          }),
        );

      const results = await Promise.all([write("Cologne"), write("Bonn")]);
      const winner = results.find((result) => result.ok);
      const conflict = results.find(
        (result) =>
          !result.ok && result.code === ConcurrencyErrorCode.VersionConflict,
      );

      expect(winner?.ok).toBe(true);
      expect(conflict?.ok).toBe(false);

      if (!winner?.ok || !conflict || conflict.ok) {
        throw new Error(
          "Expected one successful write and one version conflict.",
        );
      }

      expect(winner.value.version).toBe(2);
      expect(conflict.conflict.currentVersion).toBe(2);
      expect(conflict.conflict.current).toEqual(winner.value);

      const persisted = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      expect(persisted).toHaveLength(1);
      expect(toCurrentDto(persisted[0])).toEqual(winner.value);
    }, 30_000);

    it("returns not_found for an unknown id", async () => {
      if (!db) {
        throw new Error("Database was not initialized.");
      }

      const result = await db.transaction((tx) =>
        updateVersioned({
          tx,
          table: customers,
          id: randomUUID(),
          expectedVersion: 1,
          patch: { city: "Nowhere" },
          toDto: toCurrentDto,
        }),
      );

      expect(result).toEqual({
        ok: false,
        code: ConcurrencyErrorCode.NotFound,
      });
    }, 30_000);
  },
);
