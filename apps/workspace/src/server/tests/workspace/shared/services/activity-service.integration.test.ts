import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { SystemActorKey } from "@invessiv/common/constants/activity/system-actor-keys";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customers,
  leads,
  projects,
  users,
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
    const userId = randomUUID();
    const memberId = randomUUID();
    const customerId = randomUUID();
    const leadId = randomUUID();
    const projectId = randomUUID();
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

      const staleUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(like(users.clerk_user_id, `${FIXTURE_PREFIX}%`));
      const staleCustomers = await db
        .select({ id: customers.id })
        .from(customers)
        .where(like(customers.display_name, `${FIXTURE_PREFIX}%`));
      const staleLeads = await db
        .select({ id: leads.id })
        .from(leads)
        .where(like(leads.display_name, `${FIXTURE_PREFIX}%`));
      const staleUserIds = staleUsers.map((entry) => entry.id);
      if (staleUsers.length > 0) {
        await db
          .delete(activities)
          .where(inArray(activities.actor_user_id, staleUserIds));
      }
      if (staleCustomers.length > 0) {
        const staleCustomerIds = staleCustomers.map((entry) => entry.id);
        await db
          .delete(activities)
          .where(inArray(activities.customer_id, staleCustomerIds));
        await db
          .delete(customers)
          .where(inArray(customers.id, staleCustomerIds));
      }
      if (staleLeads.length > 0) {
        const staleLeadIds = staleLeads.map((entry) => entry.id);
        await db
          .delete(activities)
          .where(inArray(activities.lead_id, staleLeadIds));
        await db.delete(leads).where(inArray(leads.id, staleLeadIds));
      }
      if (staleUserIds.length > 0) {
        await db
          .delete(workspaceMembers)
          .where(inArray(workspaceMembers.user_id, staleUserIds));
        await db.delete(users).where(inArray(users.id, staleUserIds));
      }

      await db.insert(users).values({
        id: userId,
        clerk_user_id: `${FIXTURE_PREFIX}${userId}`,
        primary_email: `${FIXTURE_PREFIX}${userId}@example.test`,
        display_name: `${FIXTURE_PREFIX}user`,
        active: true,
        version: 1,
        created_at: now,
        updated_at: now,
      });
      await db.insert(workspaceMembers).values({
        id: memberId,
        user_id: userId,
        active: true,
        version: 1,
        created_at: now,
        updated_at: now,
      });
      await db.insert(customers).values({
        id: customerId,
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
      await db.insert(projects).values({
        id: projectId,
        customer_id: customerId,
        owner_member_id: memberId,
        title: `${FIXTURE_PREFIX}project`,
        status: ProjectStatus.Active,
        phase: ProjectPhase.Onboarding,
        process_steps: [ProjectPhase.Onboarding],
        current_process_step: ProjectPhase.Onboarding,
        workflow_key: ProjectWorkflowKey.StandardWebV1,
        billing_model: ProjectBillingModel.FixedPrice,
        included_feedback_rounds: 2,
        version: 1,
      });
    }, 30_000);

    afterAll(async () => {
      if (!db) return;
      await db.delete(activities).where(eq(activities.actor_user_id, userId));
      await db.delete(activities).where(eq(activities.lead_id, leadId));
      await db.delete(leads).where(eq(leads.id, leadId));
      await db.delete(projects).where(eq(projects.id, projectId));
      await db.delete(customers).where(eq(customers.id, customerId));
      await db
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.id, memberId));
      await db.delete(users).where(eq(users.id, userId));
    }, 30_000);

    it("writes a system lead event with its key to the activities table", async () => {
      if (!db) throw new Error("Database was not initialized.");
      const occurredAt = new Date("2026-09-12T12:00:00.000Z");

      await db.transaction((tx) =>
        activityService.createActivity(tx, {
          leadId,
          type: ActivityType.Note,
          title: "Integration note",
          occurredAt,
          actor: {
            type: ActorType.System,
            systemActorKey: SystemActorKey.Fixture,
          },
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
        actor_type: ActorType.System,
        actor_user_id: null,
        system_actor_key: SystemActorKey.Fixture,
      });
      expect(rows[0].occurred_at).toEqual(occurredAt);
    });

    it("writes a human customer project event referencing the real user", async () => {
      if (!db) throw new Error("Database was not initialized.");
      await activityService.appendActivity({
        customerId,
        projectId,
        type: ActivityType.Created,
        actor: { type: ActorType.User, userId },
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
        actor_type: ActorType.User,
        actor_user_id: userId,
        system_actor_key: null,
        actor_id: null,
        actor_label: null,
      });
    });
  },
);
