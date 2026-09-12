import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customers,
  leads,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { activityService } from "@/server/workspace/shared/services/activity-service";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.ACTIVITY_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:activity-service:";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "activityService PostgreSQL integration",
  () => {
    const memberId = randomUUID();
    const customerId = randomUUID();
    const leadId = randomUUID();
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
          "Development database URL is not configured for the activity integration test.",
        );
      }

      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();
      const now = new Date();

      await db.insert(workspaceMembers).values({
        id: memberId,
        clerk_user_id: `${FIXTURE_PREFIX}${memberId}`,
        email: `${FIXTURE_PREFIX}${memberId}@example.test`,
        role: "owner",
        active: true,
        credentials_access: false,
        version: 1,
        created_at: now,
        updated_at: now,
      });
      await db.insert(customers).values({
        id: customerId,
        customer_type: "company",
        display_name: `${FIXTURE_PREFIX}customer`,
        status: "active",
        owner_member_id: memberId,
        version: 1,
        created_at: now,
        updated_at: now,
      });
      await db.insert(leads).values({
        id: leadId,
        display_name: `${FIXTURE_PREFIX}lead`,
        source: "manual",
        lead_status: "new",
        created_at: now,
        updated_at: now,
      });
    }, 30_000);

    afterAll(async () => {
      if (!db) return;
      await db.delete(leads).where(eq(leads.id, leadId));
      await db.delete(customers).where(eq(customers.id, customerId));
      await db
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.id, memberId));
    }, 30_000);

    it("writes a lead event to the activities table", async () => {
      if (!db) throw new Error("Database was not initialized.");
      const occurredAt = new Date("2026-09-12T12:00:00.000Z");

      await db.transaction((tx) =>
        activityService.createActivity(tx, {
          leadId,
          type: ActivityType.Note,
          title: "Integration note",
          occurredAt,
          actorType: ActorType.System,
        }),
      );

      const rows = await db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.lead_id, leadId),
            eq(activities.title, "Integration note"),
          ),
        );

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        lead_id: leadId,
        customer_id: null,
        project_id: null,
        type: ActivityType.Note,
      });
      expect(rows[0].occurred_at).toEqual(occurredAt);
    });

    it("writes a customer project event without a legacy lead row", async () => {
      if (!db) throw new Error("Database was not initialized.");
      const projectId = randomUUID();

      await activityService.appendActivity({
        customerId,
        projectId,
        type: ActivityType.Created,
        actorType: ActorType.User,
        actorId: "integration-user",
      });

      const rows = await db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.customer_id, customerId),
            eq(activities.project_id, projectId),
          ),
        );

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        lead_id: null,
        customer_id: customerId,
        project_id: projectId,
        type: ActivityType.Created,
      });
    });
  },
);
