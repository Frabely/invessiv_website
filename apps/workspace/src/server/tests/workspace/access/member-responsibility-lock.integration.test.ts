import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, count, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  customers,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { memberResponsibilityLockService } from "@/server/workspace/access/services/responsibilities/member-responsibility-lock-service";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.CRM_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:member-responsibility-lock:";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe.skipIf(!RUN_INTEGRATION)(
  "member responsibility lock PostgreSQL integration",
  () => {
    const userIds: string[] = [];
    const memberIds: string[] = [];
    let db: Database | null = null;

    async function createActiveMember(database: Database): Promise<string> {
      const userId = randomUUID();
      const memberId = randomUUID();
      userIds.push(userId);
      memberIds.push(memberId);

      await database.insert(users).values({
        id: userId,
        clerk_user_id: `${FIXTURE_PREFIX}${userId}`,
        primary_email: `${FIXTURE_PREFIX}${userId}@example.test`,
        display_name: `${FIXTURE_PREFIX}user`,
        active: true,
        version: 1,
      });
      await database.insert(workspaceMembers).values({
        id: memberId,
        user_id: userId,
        active: true,
        version: 1,
      });
      return memberId;
    }

    beforeAll(() => {
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
    });

    afterAll(async () => {
      if (!db) {
        return;
      }
      for (const memberId of memberIds) {
        await db
          .delete(customers)
          .where(eq(customers.owner_member_id, memberId));
        await db
          .delete(workspaceMembers)
          .where(eq(workspaceMembers.id, memberId));
      }
      for (const userId of userIds) {
        await db.delete(users).where(eq(users.id, userId));
      }
    }, 30_000);

    it("makes a waiting deactivation count the customer assigned in parallel", async () => {
      const database = db!;
      const memberId = await createActiveMember(database);
      const assignmentLocked = deferred();
      const releaseAssignment = deferred();

      const assignment = database.transaction(async (tx) => {
        const active =
          await memberResponsibilityLockService.lockActiveMemberForAssignment(
            tx,
            memberId,
          );
        assignmentLocked.resolve();
        await releaseAssignment.promise;
        await tx.insert(customers).values({
          id: randomUUID(),
          customer_type: "company",
          display_name: `${FIXTURE_PREFIX}${randomUUID()}`,
          status: "active",
          owner_member_id: memberId,
          version: 1,
        });
        return active;
      });

      await assignmentLocked.promise;
      const deactivation = database.transaction(async (tx) => {
        await memberResponsibilityLockService.lockMemberForDeactivation(
          tx,
          memberId,
        );
        const [row] = await tx
          .select({ open: count() })
          .from(customers)
          .where(
            and(
              eq(customers.owner_member_id, memberId),
              eq(customers.status, "active"),
            ),
          );
        return row?.open ?? 0;
      });

      releaseAssignment.resolve();
      await expect(assignment).resolves.toBe(true);
      await expect(deactivation).resolves.toBe(1);
    }, 30_000);

    it("lets a waiting assignment see the committed deactivation", async () => {
      const database = db!;
      const memberId = await createActiveMember(database);
      const deactivationLocked = deferred();
      const releaseDeactivation = deferred();

      const deactivation = database.transaction(async (tx) => {
        await memberResponsibilityLockService.lockMemberForDeactivation(
          tx,
          memberId,
        );
        deactivationLocked.resolve();
        await releaseDeactivation.promise;
        await tx
          .update(workspaceMembers)
          .set({ active: false, version: 2, updated_at: new Date() })
          .where(eq(workspaceMembers.id, memberId));
      });

      await deactivationLocked.promise;
      const assignment = database.transaction((tx) =>
        memberResponsibilityLockService.lockActiveMemberForAssignment(
          tx,
          memberId,
        ),
      );

      releaseDeactivation.resolve();
      await deactivation;
      await expect(assignment).resolves.toBeFalsy();
    }, 30_000);
  },
);
