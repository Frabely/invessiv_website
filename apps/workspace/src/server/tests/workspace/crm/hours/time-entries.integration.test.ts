import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { TimeEntryListLimits } from "@invessiv/common/constants/crm/time-entry-list-limits";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CreateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/create-time-entry-request.dto";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customers,
  projectTimeEntries,
  projects,
  tasks,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import {
  TIME_ENTRY_ACTIVITY_ENTITY,
  TimeEntryActivityField,
} from "@/common/constants/crm/hours-activity-metadata";
import { businessToday } from "@/common/patterns/time/business-today";
import { createHourAllocation } from "@/server/workspace/crm/command-handler/create-hour-allocation.command-handler";
import { createHourPurchase } from "@/server/workspace/crm/command-handler/create-hour-purchase.command-handler";
import { createTimeEntry } from "@/server/workspace/crm/command-handler/create-time-entry.command-handler";
import { deleteTimeEntry } from "@/server/workspace/crm/command-handler/delete-time-entry.command-handler";
import { updateTimeEntry } from "@/server/workspace/crm/command-handler/update-time-entry.command-handler";
import { getCustomerHours } from "@/server/workspace/crm/query-handler/get-customer-hours.query-handler";
import { getTaskBookedMinutes } from "@/server/workspace/crm/query-handler/get-task-booked-minutes.query-handler";
import { listProjectTimeEntries } from "@/server/workspace/crm/query-handler/list-project-time-entries.query-handler";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.CRM_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:time-entries:";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)("time entries PostgreSQL integration", () => {
  let db: Database;
  let ownerMemberId: string;
  let ownerUserId: string;
  const today = businessToday();

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

  function member(): WorkspaceActor {
    return actor({
      permissions: new Set([
        Permission.HoursRead,
        Permission.HoursWrite,
        Permission.HoursManage,
      ]),
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

  async function createProject(customerId: string, title: string) {
    const id = randomUUID();
    await db.insert(projects).values({
      id,
      customer_id: customerId,
      owner_member_id: ownerMemberId,
      title: `${FIXTURE_PREFIX}${title}`,
      status: ProjectStatus.Active,
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

  async function createTask(
    projectId: string,
    status: TaskStatus = TaskStatus.Open,
  ) {
    const id = randomUUID();
    await db.insert(tasks).values({
      id,
      project_id: projectId,
      title: "Umbau Hero-Section",
      description: "",
      status,
      action_side: TaskActionSide.Internal,
      visible_to_customer: false,
      assignee_member_id: ownerMemberId,
      completed_at: status === TaskStatus.Done ? new Date() : null,
      completed_by_member_id: status === TaskStatus.Done ? ownerMemberId : null,
      version: 1,
    });
    return id;
  }

  function entryInput(
    overrides: Partial<CreateTimeEntryRequestDto> = {},
  ): CreateTimeEntryRequestDto {
    return {
      performedOn: today,
      durationMinutes: 60,
      description: "Umbau Hero-Section",
      billable: true,
      taskId: null,
      ...overrides,
    };
  }

  async function stock(customerId: string, minutes: number) {
    await createHourPurchase(
      customerId,
      {
        idempotencyKey: randomUUID(),
        kind: HourPurchaseKind.Purchase,
        minutes,
        purchasedOn: today,
        note: "",
      },
      member(),
    );
  }

  function allocate(customerId: string, projectId: string, minutes: number) {
    return createHourAllocation(
      customerId,
      { idempotencyKey: randomUUID(), projectId, minutes, note: "" },
      member(),
    );
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
        "Development database URL is not configured for the time entries integration test.",
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
      // Tasks and all hours tables cascade with their project.
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

  it("follows the worked example: an overdrawn project stays overdrawn until someone acts", async () => {
    const customerId = await createCustomer("example");
    const projectA = await createProject(customerId, "A");
    const projectB = await createProject(customerId, "B");
    await stock(customerId, 600);
    await allocate(customerId, projectA, 300);
    await allocate(customerId, projectB, 300);

    expect(
      await createTimeEntry(
        projectA,
        entryInput({ durationMinutes: 150 }),
        member(),
      ),
    ).toMatchObject({ ok: true, project: { remainingMinutes: 150 } });
    // No check against the allocation: the booking goes through and the project is overdrawn.
    expect(
      await createTimeEntry(
        projectB,
        entryInput({ durationMinutes: 360 }),
        member(),
      ),
    ).toMatchObject({
      ok: true,
      project: { remainingMinutes: -60, releasableMinutes: 0 },
    });

    const hours = await getCustomerHours(customerId, member());
    expect(hours?.balance).toMatchObject({
      usedMinutes: 510,
      remainingMinutes: 90,
    });
    expect(
      hours?.projects.find((project) => project.projectId === projectA),
    ).toMatchObject({ allocatedMinutes: 300, remainingMinutes: 150 });

    // A can hand back what it has not used, to the minute, and nothing more.
    expect(await allocate(customerId, projectA, -165)).toMatchObject({
      ok: false,
      code: HoursErrorCode.InsufficientReleasableHours,
    });
    expect(await allocate(customerId, projectA, -60)).toMatchObject({
      ok: true,
    });
    expect(await allocate(customerId, projectB, 60)).toMatchObject({
      ok: true,
      project: { remainingMinutes: 0 },
    });
  });

  it("accepts only durations on the booking step and no day in the future", async () => {
    const customerId = await createCustomer("validation");
    const projectId = await createProject(customerId, "A");

    for (const durationMinutes of [
      0,
      10,
      20,
      HoursLimits.MaxEntryMinutes + 15,
    ]) {
      expect(
        await createTimeEntry(
          projectId,
          entryInput({ durationMinutes }),
          member(),
        ),
      ).toMatchObject({ ok: false, code: HoursErrorCode.ValidationError });
    }
    for (const durationMinutes of [
      15,
      1440,
      1455,
      HoursLimits.MaxEntryMinutes,
    ]) {
      expect(
        await createTimeEntry(
          projectId,
          entryInput({ durationMinutes }),
          member(),
        ),
      ).toMatchObject({ ok: true });
    }
    expect(
      await createTimeEntry(
        projectId,
        entryInput({ performedOn: "2999-01-01" }),
        member(),
      ),
    ).toMatchObject({ ok: false, code: HoursErrorCode.ValidationError });
    expect(
      await createTimeEntry(
        projectId,
        entryInput({ description: "   " }),
        member(),
      ),
    ).toMatchObject({ ok: false, code: HoursErrorCode.ValidationError });
  });

  it("links only a task of the same project that is not cancelled", async () => {
    const customerId = await createCustomer("tasks");
    const projectId = await createProject(customerId, "A");
    const siblingProjectId = await createProject(customerId, "B");
    const openTask = await createTask(projectId);
    const doneTask = await createTask(projectId, TaskStatus.Done);
    const cancelledTask = await createTask(projectId, TaskStatus.Cancelled);
    const siblingTask = await createTask(siblingProjectId);

    for (const taskId of [cancelledTask, siblingTask, randomUUID()]) {
      expect(
        await createTimeEntry(projectId, entryInput({ taskId }), member()),
      ).toMatchObject({ ok: false, code: HoursErrorCode.TaskNotLinkable });
    }
    expect(
      await createTimeEntry(
        projectId,
        entryInput({ taskId: openTask }),
        member(),
      ),
    ).toMatchObject({ ok: true, timeEntry: { taskId: openTask } });
    const second = await createTimeEntry(
      projectId,
      entryInput({ taskId: doneTask, durationMinutes: 30, billable: false }),
      member(),
    );
    expect(second).toMatchObject({ ok: true });
    await createTimeEntry(
      projectId,
      entryInput({ taskId: doneTask, durationMinutes: 45 }),
      member(),
    );

    // How long a task took, goodwill included; a task without any entry simply has no figure.
    expect(await getTaskBookedMinutes(customerId, member())).toEqual({
      [openTask]: 60,
      [doneTask]: 75,
    });

    // An entry keeps its link when the task is cancelled afterwards, and stays editable.
    await db
      .update(tasks)
      .set({ status: TaskStatus.Cancelled })
      .where(eq(tasks.id, openTask));
    const [linked] = await db
      .select()
      .from(projectTimeEntries)
      .where(eq(projectTimeEntries.task_id, openTask));
    expect(
      await updateTimeEntry(
        linked.id,
        {
          ...entryInput({ taskId: openTask, durationMinutes: 90 }),
          version: 1,
        },
        member(),
      ),
    ).toMatchObject({ ok: true, timeEntry: { durationMinutes: 90 } });
  });

  it("keeps goodwill out of used and remaining", async () => {
    const customerId = await createCustomer("goodwill");
    const projectId = await createProject(customerId, "A");
    await stock(customerId, 300);
    await allocate(customerId, projectId, 300);

    expect(
      await createTimeEntry(
        projectId,
        entryInput({ durationMinutes: 30, billable: false }),
        member(),
      ),
    ).toMatchObject({
      ok: true,
      project: { usedMinutes: 0, goodwillMinutes: 30, remainingMinutes: 300 },
    });
  });

  it("updates and deletes only against the current version and logs without the text", async () => {
    const customerId = await createCustomer("versions");
    const projectId = await createProject(customerId, "A");
    await stock(customerId, 300);
    await allocate(customerId, projectId, 300);
    const created = await createTimeEntry(projectId, entryInput(), member());
    if (!created.ok) throw new Error("fixture entry was not created");
    const id = created.timeEntry.id;

    const updated = await updateTimeEntry(
      id,
      {
        ...entryInput({
          durationMinutes: 90,
          description: "Geheimer neuer Text",
        }),
        version: 1,
      },
      member(),
    );
    expect(updated).toMatchObject({
      ok: true,
      timeEntry: { durationMinutes: 90, version: 2 },
      project: { usedMinutes: 90, remainingMinutes: 210 },
    });

    expect(
      await updateTimeEntry(id, { ...entryInput(), version: 1 }, member()),
    ).toMatchObject({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: { currentVersion: 2, current: { durationMinutes: 90 } },
    });
    expect(await deleteTimeEntry(id, { version: 1 }, member())).toMatchObject({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
    });
    expect(
      await db
        .select({ id: projectTimeEntries.id })
        .from(projectTimeEntries)
        .where(eq(projectTimeEntries.id, id)),
    ).toHaveLength(1);

    expect(await deleteTimeEntry(id, { version: 2 }, member())).toMatchObject({
      ok: true,
      deleted: true,
      project: { usedMinutes: 0, remainingMinutes: 300 },
    });
    expect(await deleteTimeEntry(id, { version: 2 }, member())).toMatchObject({
      ok: false,
      code: HoursErrorCode.TimeEntryNotFound,
    });

    const log = await db
      .select({ type: activities.type, metadata: activities.metadata })
      .from(activities)
      .where(
        and(
          eq(activities.customer_id, customerId),
          eq(activities.project_id, projectId),
        ),
      );
    const entryLog = log
      .map((row) => row.metadata as { entity: string; field?: string } | null)
      .filter((metadata) => metadata?.entity === TIME_ENTRY_ACTIVITY_ENTITY);
    expect(
      log.filter(
        (row) =>
          row.type === ActivityType.Created &&
          (row.metadata as { entity: string }).entity ===
            TIME_ENTRY_ACTIVITY_ENTITY,
      ),
    ).toHaveLength(1);
    expect(entryLog.map((metadata) => metadata?.field).sort()).toEqual(
      [
        undefined,
        TimeEntryActivityField.Deleted,
        TimeEntryActivityField.Description,
        TimeEntryActivityField.Duration,
      ].sort(),
    );
    expect(JSON.stringify(log)).not.toContain("Geheimer neuer Text");
    expect(JSON.stringify(log)).not.toContain("Umbau Hero-Section");
  });

  it("books nothing on a closed project but still lets its entries be removed", async () => {
    const customerId = await createCustomer("closed");
    const projectId = await createProject(customerId, "A");
    const created = await createTimeEntry(projectId, entryInput(), member());
    if (!created.ok) throw new Error("fixture entry was not created");
    await db
      .update(projects)
      .set({ status: ProjectStatus.Archived })
      .where(eq(projects.id, projectId));

    expect(
      await createTimeEntry(projectId, entryInput(), member()),
    ).toMatchObject({ ok: false, code: HoursErrorCode.ProjectClosed });
    expect(
      await deleteTimeEntry(created.timeEntry.id, { version: 1 }, member()),
    ).toMatchObject({ ok: true });
  });

  it("answers like a missing project or entry outside the actor's reach", async () => {
    const customerId = await createCustomer("scope");
    const otherCustomerId = await createCustomer("scope-other");
    const projectId = await createProject(customerId, "A");
    const siblingProjectId = await createProject(customerId, "B");
    const foreignProjectId = await createProject(otherCustomerId, "foreign");
    const sibling = await createTimeEntry(
      siblingProjectId,
      entryInput(),
      member(),
    );
    if (!sibling.ok) throw new Error("fixture entry was not created");

    const projectWriter = actor({
      projectPermissions: new Map([
        [
          projectId,
          {
            customerId,
            permissions: new Set([Permission.HoursRead, Permission.HoursWrite]),
          },
        ],
      ]),
    });
    expect(
      await createTimeEntry(projectId, entryInput(), projectWriter),
    ).toMatchObject({ ok: true });
    for (const target of [siblingProjectId, foreignProjectId, randomUUID()]) {
      expect(
        await createTimeEntry(target, entryInput(), projectWriter),
      ).toMatchObject({ ok: false, code: HoursErrorCode.ProjectNotFound });
    }
    expect(
      await updateTimeEntry(
        sibling.timeEntry.id,
        { ...entryInput(), version: 1 },
        projectWriter,
      ),
    ).toMatchObject({ ok: false, code: HoursErrorCode.TimeEntryNotFound });
    expect(
      await deleteTimeEntry(
        sibling.timeEntry.id,
        { version: 1 },
        projectWriter,
      ),
    ).toMatchObject({ ok: false, code: HoursErrorCode.TimeEntryNotFound });
    expect(
      await listProjectTimeEntries(siblingProjectId, {}, projectWriter),
    ).toMatchObject({ ok: false, code: HoursErrorCode.ProjectNotFound });

    // Reading alone books nothing.
    const reader = actor({ permissions: new Set([Permission.HoursRead]) });
    expect(
      await createTimeEntry(projectId, entryInput(), reader),
    ).toMatchObject({ ok: false, code: HoursErrorCode.ProjectNotFound });
    // The task figures follow the same scope.
    expect(await getTaskBookedMinutes(customerId, actor())).toEqual({});
  });

  it("pages entries of one day without repeating or losing one", async () => {
    const customerId = await createCustomer("paging");
    const projectId = await createProject(customerId, "A");
    const total = TimeEntryListLimits.PageSize + 5;
    // One statement gives every row the same created_at, the hardest case for a keyset.
    await db.insert(projectTimeEntries).values(
      Array.from({ length: total }, (_, index) => ({
        id: randomUUID(),
        customer_id: customerId,
        project_id: projectId,
        task_id: null,
        performed_on: today,
        duration_minutes: 15,
        description: `Eintrag ${index}`,
        billable: true,
        performed_by_member_id: ownerMemberId,
        version: 1,
      })),
    );

    const first = await listProjectTimeEntries(projectId, {}, member());
    if (!first.ok) throw new Error("first page failed");
    expect(first.page.entries).toHaveLength(TimeEntryListLimits.PageSize);
    expect(first.page.nextCursor).not.toBeNull();

    const second = await listProjectTimeEntries(
      projectId,
      { cursor: first.page.nextCursor },
      member(),
    );
    if (!second.ok) throw new Error("second page failed");
    expect(second.page.entries).toHaveLength(5);
    expect(second.page.nextCursor).toBeNull();

    const ids = [...first.page.entries, ...second.page.entries].map(
      (entry) => entry.id,
    );
    expect(new Set(ids).size).toBe(total);

    expect(
      await listProjectTimeEntries(projectId, { cursor: "broken" }, member()),
    ).toMatchObject({ ok: false, code: HoursErrorCode.ValidationError });
  });
});
