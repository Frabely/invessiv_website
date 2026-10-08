import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customerHourPurchases,
  customers,
  projectHourAllocations,
  projectTimeEntries,
  projects,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import {
  HOUR_ALLOCATION_ACTIVITY_ENTITY,
  HOUR_PURCHASE_ACTIVITY_ENTITY,
} from "@/common/constants/crm/hours-activity-metadata";
import { createHourAllocation } from "@/server/workspace/crm/command-handler/create-hour-allocation.command-handler";
import { createHourPurchase } from "@/server/workspace/crm/command-handler/create-hour-purchase.command-handler";
import { getCustomerHours } from "@/server/workspace/crm/query-handler/get-customer-hours.query-handler";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.CRM_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:hours:";
const TODAY = "2026-10-08";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)("hours ledger PostgreSQL integration", () => {
  let db: Database;
  let ownerMemberId: string;
  let ownerUserId: string;

  function actor(overrides: Partial<WorkspaceActor> = {}): WorkspaceActor {
    return {
      userId: ownerUserId,
      workspaceMemberId: ownerMemberId,
      permissions: new Set(),
      customerPermissions: new Map(),
      projectPermissions: new Map(),
      ...overrides,
    };
  }

  function manager(): WorkspaceActor {
    return actor({
      permissions: new Set([Permission.HoursRead, Permission.HoursManage]),
    });
  }

  async function createCustomer(label: string) {
    const id = randomUUID();
    await db.insert(customers).values({
      id,
      display_name: `${FIXTURE_PREFIX}customer:${label}:${id}`,
      status: CustomerStatus.Active,
      owner_member_id: ownerMemberId,
      version: 1,
    });
    return id;
  }

  async function createProject(
    customerId: string,
    title: string,
    status: ProjectStatus = ProjectStatus.Active,
  ) {
    const id = randomUUID();
    await db.insert(projects).values({
      id,
      customer_id: customerId,
      owner_member_id: ownerMemberId,
      title: `${FIXTURE_PREFIX}${title}`,
      status,
      phase: ProjectPhase.Onboarding,
      process_steps: [ProjectPhase.Onboarding],
      current_process_step: ProjectPhase.Onboarding,
      workflow_key: ProjectWorkflowKey.StandardWebV1,
      billing_model: ProjectBillingModel.FixedPrice,
      included_feedback_rounds: 2,
      version: 1,
    });
    return id;
  }

  function purchase(customerId: string, minutes: number, by = manager()) {
    return createHourPurchase(
      customerId,
      {
        idempotencyKey: randomUUID(),
        kind:
          minutes > 0 ? HourPurchaseKind.Purchase : HourPurchaseKind.Correction,
        minutes,
        purchasedOn: TODAY,
        note: "Betreuungspaket",
      },
      by,
    );
  }

  function allocate(
    customerId: string,
    projectId: string,
    minutes: number,
    by = manager(),
  ) {
    return createHourAllocation(
      customerId,
      { idempotencyKey: randomUUID(), projectId, minutes, note: "" },
      by,
    );
  }

  async function bookDirectly(
    customerId: string,
    projectId: string,
    minutes: number,
  ) {
    // Time entries get their own command in Task 72; the ledger rules already depend on them.
    await db.insert(projectTimeEntries).values({
      id: randomUUID(),
      customer_id: customerId,
      project_id: projectId,
      task_id: null,
      performed_on: TODAY,
      duration_minutes: minutes,
      description: "Umbau Hero-Section",
      billable: true,
      performed_by_member_id: ownerMemberId,
      version: 1,
    });
  }

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
        "Development database URL is not configured for the hours integration test.",
      );
    }
    process.env.DATABASE_URL = databaseUrl;
    db = getDrizzleDatabaseClient();

    ownerUserId = randomUUID();
    ownerMemberId = randomUUID();
    await db.insert(users).values({
      id: ownerUserId,
      clerk_user_id: `${FIXTURE_PREFIX}${ownerUserId}`,
      primary_email: `${FIXTURE_PREFIX}${ownerUserId}@example.test`,
      display_name: `${FIXTURE_PREFIX}owner`,
      active: true,
      version: 1,
    });
    await db.insert(workspaceMembers).values({
      id: ownerMemberId,
      user_id: ownerUserId,
      active: true,
      version: 1,
    });
  }, 60_000);

  afterAll(async () => {
    if (!db) return;
    const fixtureCustomers = await db
      .select({ id: customers.id })
      .from(customers)
      .where(like(customers.display_name, `${FIXTURE_PREFIX}%`));
    const customerIds = fixtureCustomers.map((row) => row.id);
    if (customerIds.length > 0) {
      await db
        .delete(activities)
        .where(inArray(activities.customer_id, customerIds));
      // All three hours tables cascade with their project or customer.
      await db
        .delete(projects)
        .where(inArray(projects.customer_id, customerIds));
      await db.delete(customers).where(inArray(customers.id, customerIds));
    }
    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, ownerMemberId));
    await db.delete(users).where(eq(users.id, ownerUserId));
  }, 60_000);

  it("follows the worked example: purchase, allocate, reject a correction below the allocation", async () => {
    const customerId = await createCustomer("example");
    const projectA = await createProject(customerId, "A");
    const projectB = await createProject(customerId, "B");

    const bought = await purchase(customerId, 600);
    expect(bought).toMatchObject({
      ok: true,
      balance: { purchasedMinutes: 600, freeMinutes: 600 },
    });

    expect(await allocate(customerId, projectA, 300)).toMatchObject({
      ok: true,
      balance: { freeMinutes: 300 },
      project: { allocatedMinutes: 300, remainingMinutes: 300 },
    });
    expect(await allocate(customerId, projectB, 300)).toMatchObject({
      ok: true,
      balance: { allocatedMinutes: 600, freeMinutes: 0 },
    });

    expect(await purchase(customerId, -60)).toMatchObject({
      ok: false,
      code: HoursErrorCode.BelowAllocatedHours,
      balance: { purchasedMinutes: 600, allocatedMinutes: 600 },
    });
    expect(await allocate(customerId, projectA, 15)).toMatchObject({
      ok: false,
      code: HoursErrorCode.InsufficientFreeHours,
      balance: { freeMinutes: 0 },
    });
  });

  it("never balances an overdrawn project from another one", async () => {
    const customerId = await createCustomer("overdrawn");
    const projectA = await createProject(customerId, "A");
    const projectB = await createProject(customerId, "B");
    await purchase(customerId, 600);
    await allocate(customerId, projectA, 300);
    await allocate(customerId, projectB, 300);
    await bookDirectly(customerId, projectA, 150);
    await bookDirectly(customerId, projectB, 360);

    const hours = await getCustomerHours(customerId, manager());
    expect(hours?.balance).toMatchObject({
      usedMinutes: 510,
      remainingMinutes: 90,
      freeMinutes: 0,
    });
    expect(hours?.projects).toEqual([
      expect.objectContaining({
        projectId: projectA,
        remainingMinutes: 150,
        releasableMinutes: 150,
      }),
      expect.objectContaining({
        projectId: projectB,
        remainingMinutes: -60,
        releasableMinutes: 0,
      }),
    ]);

    // B has nothing to give back, and A can only hand over what it has not used.
    expect(await allocate(customerId, projectB, -15)).toMatchObject({
      ok: false,
      code: HoursErrorCode.InsufficientReleasableHours,
    });
    expect(await allocate(customerId, projectA, -165)).toMatchObject({
      ok: false,
      code: HoursErrorCode.InsufficientReleasableHours,
      project: { releasableMinutes: 150 },
    });

    // Only the explicit pair of release and allocation settles B.
    expect(await allocate(customerId, projectA, -60)).toMatchObject({
      ok: true,
      balance: { freeMinutes: 60 },
    });
    expect(await allocate(customerId, projectB, 60)).toMatchObject({
      ok: true,
      balance: { freeMinutes: 0 },
      project: { allocatedMinutes: 360, remainingMinutes: 0 },
    });
  });

  it("lets exactly one of two concurrent allocations draw the free hours", async () => {
    const customerId = await createCustomer("concurrent");
    const projectA = await createProject(customerId, "A");
    const projectB = await createProject(customerId, "B");
    await purchase(customerId, 600);

    const results = await Promise.all([
      allocate(customerId, projectA, 360),
      allocate(customerId, projectB, 360),
    ]);

    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.find((result) => !result.ok)).toMatchObject({
      code: HoursErrorCode.InsufficientFreeHours,
    });
    const rows = await db
      .select({ minutes: projectHourAllocations.minutes })
      .from(projectHourAllocations)
      .where(eq(projectHourAllocations.customer_id, customerId));
    expect(rows).toEqual([{ minutes: 360 }]);
  });

  it("treats a repeated idempotency key as the same write", async () => {
    const customerId = await createCustomer("idempotent");
    const otherCustomerId = await createCustomer("idempotent-other");
    const projectId = await createProject(customerId, "A");
    const purchaseRequest = {
      idempotencyKey: randomUUID(),
      kind: HourPurchaseKind.Purchase,
      minutes: 120,
      purchasedOn: TODAY,
      note: "",
    };

    const first = await createHourPurchase(
      customerId,
      purchaseRequest,
      manager(),
    );
    const second = await createHourPurchase(
      customerId,
      purchaseRequest,
      manager(),
    );
    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({
      ok: true,
      balance: { purchasedMinutes: 120 },
    });
    expect(
      await db
        .select({ id: customerHourPurchases.id })
        .from(customerHourPurchases)
        .where(eq(customerHourPurchases.customer_id, customerId)),
    ).toHaveLength(1);
    expect(
      await createHourPurchase(otherCustomerId, purchaseRequest, manager()),
    ).toMatchObject({ ok: false, code: HoursErrorCode.ValidationError });

    const allocationRequest = {
      idempotencyKey: randomUUID(),
      projectId,
      minutes: 60,
      note: "",
    };
    await createHourAllocation(customerId, allocationRequest, manager());
    expect(
      await createHourAllocation(customerId, allocationRequest, manager()),
    ).toMatchObject({ ok: true, balance: { allocatedMinutes: 60 } });

    const written = await db
      .select({ type: activities.type, metadata: activities.metadata })
      .from(activities)
      .where(eq(activities.customer_id, customerId));
    expect(written).toHaveLength(2);
    expect(written.map((row) => row.type)).toEqual([
      ActivityType.Created,
      ActivityType.Created,
    ]);
    expect(
      written.map((row) => (row.metadata as { entity: string }).entity).sort(),
    ).toEqual([HOUR_ALLOCATION_ACTIVITY_ENTITY, HOUR_PURCHASE_ACTIVITY_ENTITY]);
    // The note is free text and must never reach the append-only log.
    expect(JSON.stringify(written)).not.toContain("note");
  });

  it("rejects invalid input before touching the ledger", async () => {
    const customerId = await createCustomer("validation");
    const base = {
      idempotencyKey: randomUUID(),
      kind: HourPurchaseKind.Purchase,
      minutes: 60,
      purchasedOn: TODAY,
      note: "",
    };

    for (const override of [
      { minutes: 0 },
      { minutes: 20 },
      { minutes: -60 },
      { kind: HourPurchaseKind.Correction },
      { purchasedOn: "2999-01-01" },
      { purchasedOn: "08.10.2026" },
      { note: "x".repeat(201) },
    ]) {
      expect(
        await createHourPurchase(
          customerId,
          { ...base, ...override },
          manager(),
        ),
      ).toMatchObject({ ok: false, code: HoursErrorCode.ValidationError });
    }
    expect(
      await db
        .select({ id: customerHourPurchases.id })
        .from(customerHourPurchases)
        .where(eq(customerHourPurchases.customer_id, customerId)),
    ).toHaveLength(0);
  });

  it("allocates nothing to a closed project but still lets it release", async () => {
    const customerId = await createCustomer("closed");
    const projectId = await createProject(customerId, "A");
    await purchase(customerId, 300);
    await allocate(customerId, projectId, 120);
    await db
      .update(projects)
      .set({ status: ProjectStatus.Archived })
      .where(eq(projects.id, projectId));

    expect(await allocate(customerId, projectId, 60)).toMatchObject({
      ok: false,
      code: HoursErrorCode.ProjectClosed,
    });
    expect(await allocate(customerId, projectId, -120)).toMatchObject({
      ok: true,
      balance: { freeMinutes: 300 },
      project: { allocatedMinutes: 0 },
    });
  });

  it("answers like a missing customer or project outside the actor's reach", async () => {
    const customerId = await createCustomer("scope");
    const otherCustomerId = await createCustomer("scope-other");
    const projectId = await createProject(customerId, "A");
    const foreignProjectId = await createProject(otherCustomerId, "foreign");
    await purchase(customerId, 300);

    const reader = actor({ permissions: new Set([Permission.HoursRead]) });
    expect(await purchase(customerId, 60, reader)).toMatchObject({
      ok: false,
      code: HoursErrorCode.CustomerNotFound,
    });
    expect(await allocate(customerId, projectId, 60, reader)).toMatchObject({
      ok: false,
      code: HoursErrorCode.CustomerNotFound,
    });

    const boundManager = actor({
      customerPermissions: new Map([
        [customerId, new Set([Permission.HoursManage])],
      ]),
    });
    expect(await purchase(otherCustomerId, 60, boundManager)).toMatchObject({
      ok: false,
      code: HoursErrorCode.CustomerNotFound,
    });
    // A project of another customer never resolves through this customer's URL.
    expect(
      await allocate(customerId, foreignProjectId, 60, boundManager),
    ).toMatchObject({ ok: false, code: HoursErrorCode.ProjectNotFound });
    expect(
      await allocate(customerId, projectId, 60, boundManager),
    ).toMatchObject({ ok: true });
    expect(await purchase(randomUUID(), 60)).toMatchObject({
      ok: false,
      code: HoursErrorCode.CustomerNotFound,
    });
  });

  it("shows a project-bound reader its project but neither stock nor purchases", async () => {
    const customerId = await createCustomer("read-scope");
    const projectA = await createProject(customerId, "A");
    const projectB = await createProject(customerId, "B");
    await purchase(customerId, 600);
    await allocate(customerId, projectA, 120);
    await allocate(customerId, projectB, 180);

    const projectReader = actor({
      projectPermissions: new Map([
        [
          projectA,
          { customerId, permissions: new Set([Permission.HoursRead]) },
        ],
      ]),
    });
    const scoped = await getCustomerHours(customerId, projectReader);
    expect(scoped).toMatchObject({ balance: null, purchases: [] });
    expect(scoped?.projects.map((project) => project.projectId)).toEqual([
      projectA,
    ]);
    expect(scoped?.allocations.map((row) => row.projectId)).toEqual([projectA]);

    const full = await getCustomerHours(customerId, manager());
    expect(full?.balance).toMatchObject({
      purchasedMinutes: 600,
      allocatedMinutes: 300,
      freeMinutes: 300,
    });
    expect(full?.projects).toHaveLength(2);
    expect(full?.purchases).toHaveLength(1);
    expect(full?.allocations).toHaveLength(2);

    expect(await getCustomerHours(customerId, actor())).toBeNull();
    expect(
      await getCustomerHours(
        customerId,
        actor({ permissions: new Set([Permission.TasksRead]) }),
      ),
    ).toBeNull();
  });

  it("shows an empty stock to a customer-wide reader of a customer without hours", async () => {
    const customerId = await createCustomer("empty");

    expect(await getCustomerHours(customerId, manager())).toEqual({
      balance: {
        purchasedMinutes: 0,
        allocatedMinutes: 0,
        freeMinutes: 0,
        usedMinutes: 0,
        goodwillMinutes: 0,
        remainingMinutes: 0,
      },
      projects: [],
      purchases: [],
      allocations: [],
    });
  });
});
