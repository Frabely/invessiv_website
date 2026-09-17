import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, count, eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customers,
  leads,
  people,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { convertLeadToCustomer } from "@/server/workspace/crm/command-handler/convert-lead-to-customer.command-handler";
import { createCustomerRequestFixture } from "@/server/tests/workspace/crm/support/crm-fixtures";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.CRM_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:lead-conversion:";
type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)(
  "lead conversion PostgreSQL integration",
  () => {
    const userId = randomUUID();
    const memberId = randomUUID();
    const parallelLeadId = randomUUID();
    const rollbackLeadId = randomUUID();
    const existingCustomerId = randomUUID();
    const parallelDisplayName = `${FIXTURE_PREFIX}parallel`;
    const rollbackDisplayName = `${FIXTURE_PREFIX}rollback`;
    const actor: WorkspaceActor = {
      userId,
      workspaceMemberId: memberId,
      permissions: new Set(),
    };
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

      await db.insert(users).values({
        id: userId,
        clerk_user_id: `${FIXTURE_PREFIX}${userId}`,
        primary_email: `${userId}@example.test`,
        display_name: `${FIXTURE_PREFIX}user`,
        active: true,
        version: 1,
      });
      await db.insert(workspaceMembers).values({
        id: memberId,
        user_id: userId,
        active: true,
        version: 1,
      });
      await db.insert(customers).values({
        id: existingCustomerId,
        display_name: rollbackDisplayName,
        status: "active",
        owner_member_id: memberId,
        version: 1,
      });
      await db.insert(leads).values([
        {
          id: parallelLeadId,
          display_name: `${FIXTURE_PREFIX}parallel-lead`,
          source: "manual",
          lead_status: "qualified",
        },
        {
          id: rollbackLeadId,
          display_name: `${FIXTURE_PREFIX}rollback-lead`,
          source: "manual",
          lead_status: "qualified",
        },
      ]);
      await db.insert(activities).values({
        id: randomUUID(),
        lead_id: parallelLeadId,
        customer_id: null,
        project_id: null,
        type: ActivityType.Note,
        title: null,
        body: null,
        metadata: null,
        occurred_at: new Date(),
        actor_type: ActorType.User,
        actor_user_id: userId,
        system_actor_key: null,
        actor_id: null,
        actor_label: null,
      });
    }, 30_000);

    afterAll(async () => {
      if (!db) return;
      await db
        .delete(leads)
        .where(inArray(leads.id, [parallelLeadId, rollbackLeadId]));
      await db
        .delete(customers)
        .where(
          inArray(customers.display_name, [
            parallelDisplayName,
            rollbackDisplayName,
          ]),
        );
      await db
        .delete(people)
        .where(
          inArray(people.display_name, [
            "Parallel Contact",
            "Rollback Contact",
          ]),
        );
      await db
        .delete(workspaceMembers)
        .where(eq(workspaceMembers.id, memberId));
      await db.delete(users).where(eq(users.id, userId));
    }, 30_000);

    it("serializes parallel requests, links history and returns the same customer on retry", async () => {
      if (!db) throw new Error("Database was not initialized.");
      const request = createCustomerRequestFixture({
        displayName: parallelDisplayName,
        companyName: null,
        categoryId: null,
        primaryContact: {
          firstName: "Parallel",
          lastName: "Contact",
          email: null,
          phone: null,
          roleLabel: null,
          preferredLocale: "de",
        },
      });

      const [first, second] = await Promise.all([
        convertLeadToCustomer(parallelLeadId, request, actor),
        convertLeadToCustomer(parallelLeadId, request, actor),
      ]);
      expect(first.ok).toBe(true);
      expect(second.ok).toBe(true);
      if (!first.ok || !second.ok) throw new Error("Conversion failed.");
      expect(second.customer.id).toBe(first.customer.id);

      const retry = await convertLeadToCustomer(parallelLeadId, request, actor);
      expect(retry.ok).toBe(true);
      if (!retry.ok) throw new Error("Retry failed.");
      expect(retry.customer.id).toBe(first.customer.id);

      const [lead] = await db
        .select({ customerId: leads.customer_id, status: leads.lead_status })
        .from(leads)
        .where(eq(leads.id, parallelLeadId));
      expect(lead).toEqual({ customerId: first.customer.id, status: "won" });

      const history = await db
        .select({ customerId: activities.customer_id, type: activities.type })
        .from(activities)
        .where(eq(activities.lead_id, parallelLeadId));
      expect(history).toHaveLength(2);
      expect(
        history.every((entry) => entry.customerId === first.customer.id),
      ).toBe(true);
      expect(
        history.filter(
          (entry) => entry.type === ActivityType.ConvertedFromLead,
        ),
      ).toHaveLength(1);
    }, 30_000);

    it("rolls back the person when the customer display name conflicts", async () => {
      if (!db) throw new Error("Database was not initialized.");
      const request = createCustomerRequestFixture({
        displayName: rollbackDisplayName,
        companyName: null,
        categoryId: null,
        primaryContact: {
          firstName: "Rollback",
          lastName: "Contact",
          email: null,
          phone: null,
          roleLabel: null,
          preferredLocale: "de",
        },
      });

      await expect(
        convertLeadToCustomer(rollbackLeadId, request, actor),
      ).resolves.toEqual({
        ok: false,
        code: LeadConversionErrorCode.DisplayNameTaken,
      });

      const [personCount] = await db
        .select({ value: count() })
        .from(people)
        .where(
          and(
            eq(people.first_name, "Rollback"),
            eq(people.last_name, "Contact"),
          ),
        );
      expect(personCount?.value).toBe(0);
      const [lead] = await db
        .select({ customerId: leads.customer_id, status: leads.lead_status })
        .from(leads)
        .where(eq(leads.id, rollbackLeadId));
      expect(lead).toEqual({ customerId: null, status: "qualified" });
    }, 30_000);
  },
);
