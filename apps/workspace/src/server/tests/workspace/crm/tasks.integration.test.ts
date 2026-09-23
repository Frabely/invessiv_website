import { randomUUID } from "node:crypto";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, eq, inArray, like } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  activities,
  customers,
  projects,
  tasks,
  users,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import type { UpdateTaskRequestDto } from "@invessiv/common/contracts/crm/update-task-request.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { changeTaskStatus } from "@/server/workspace/crm/command-handler/change-task-status.command-handler";
import { createTask } from "@/server/workspace/crm/command-handler/create-task.command-handler";
import { updateTask } from "@/server/workspace/crm/command-handler/update-task.command-handler";
import { TaskListPeriod } from "@/common/constants/crm/list/task-list-periods";
import { TaskListStatusFilter } from "@/common/constants/crm/list/task-list-status-filters";
import { DEFAULT_TASK_LIST_FILTERS } from "@/common/defaults/crm/task-list-default-filters";
import { listTasks } from "@/server/workspace/crm/query-handler/list-tasks.query-handler";
import { listMyDueTasks } from "@/server/workspace/crm/query-handler/list-my-due-tasks.query-handler";
import { listCustomerTasks } from "@/server/workspace/crm/query-handler/list-customer-tasks.query-handler";
import { listProjectTasks } from "@/server/workspace/crm/query-handler/list-project-tasks.query-handler";

vi.mock("server-only", () => ({}));

const RUN_INTEGRATION = process.env.CRM_DB_INTEGRATION === "true";
const FIXTURE_PREFIX = "integration:tasks:";

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(!RUN_INTEGRATION)("tasks PostgreSQL integration", () => {
  let db: Database;
  let ownerMemberId: string;
  let ownerUserId: string;
  let inactiveMemberId: string;
  let inactiveUserId: string;
  let customerAlpha: string;
  let customerBeta: string;
  let projectAlphaSite: string;
  let projectAlphaShop: string;
  let projectBetaSite: string;

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

  function customerBoundActor(
    customerId: string,
    ...permissions: Permission[]
  ): WorkspaceActor {
    return actor({
      customerPermissions: new Map([[customerId, new Set(permissions)]]),
    });
  }

  function projectBoundActor(
    projectId: string,
    customerId: string,
    ...permissions: Permission[]
  ): WorkspaceActor {
    return actor({
      projectPermissions: new Map([
        [projectId, { customerId, permissions: new Set(permissions) }],
      ]),
    });
  }

  const writer = () => actor({ permissions: new Set([Permission.TasksWrite]) });

  function taskInput(overrides: Record<string, unknown> = {}) {
    return {
      title: `${FIXTURE_PREFIX}task`,
      description: "",
      actionSide: TaskActionSide.Internal,
      visibleToCustomer: false,
      assigneeMemberId: null,
      dueOn: null,
      ...overrides,
    };
  }

  function updateInput(
    overrides: Partial<UpdateTaskRequestDto> = {},
  ): UpdateTaskRequestDto {
    return {
      title: `${FIXTURE_PREFIX}task`,
      description: "",
      actionSide: TaskActionSide.Internal,
      visibleToCustomer: false,
      assigneeMemberId: ownerMemberId,
      dueOn: null,
      version: 1,
      ...overrides,
    };
  }

  async function createMember(active: boolean) {
    const userId = randomUUID();
    const memberId = randomUUID();
    await db.insert(users).values({
      id: userId,
      clerk_user_id: `${FIXTURE_PREFIX}${userId}`,
      primary_email: `${FIXTURE_PREFIX}${userId}@example.test`,
      display_name: `${FIXTURE_PREFIX}member`,
      active,
      version: 1,
    });
    await db.insert(workspaceMembers).values({
      id: memberId,
      user_id: userId,
      active,
      version: 1,
    });
    return { userId, memberId };
  }

  async function createCustomer(label: string) {
    const id = randomUUID();
    await db.insert(customers).values({
      id,
      display_name: `${FIXTURE_PREFIX}customer:${label}`,
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

  async function taskActivities(projectId: string) {
    return db
      .select({
        type: activities.type,
        customerId: activities.customer_id,
        metadata: activities.metadata,
      })
      .from(activities)
      .where(eq(activities.project_id, projectId));
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
        "Development database URL is not configured for the tasks integration test.",
      );
    }
    process.env.DATABASE_URL = databaseUrl;
    db = getDrizzleDatabaseClient();

    ({ userId: ownerUserId, memberId: ownerMemberId } =
      await createMember(true));
    ({ userId: inactiveUserId, memberId: inactiveMemberId } =
      await createMember(false));

    customerAlpha = await createCustomer("alpha");
    customerBeta = await createCustomer("beta");
    projectAlphaSite = await createProject(customerAlpha, "alpha site");
    projectAlphaShop = await createProject(customerAlpha, "alpha shop");
    projectBetaSite = await createProject(customerBeta, "beta site");
  }, 60_000);

  afterAll(async () => {
    if (!db) return;
    const pattern = `${FIXTURE_PREFIX}%`;
    const fixtureCustomers = await db
      .select({ id: customers.id })
      .from(customers)
      .where(like(customers.display_name, pattern));
    const customerIds = fixtureCustomers.map((row) => row.id);
    if (customerIds.length > 0) {
      await db
        .delete(activities)
        .where(inArray(activities.customer_id, customerIds));
      // `tasks` cascades with its project, so deleting projects is enough.
      await db
        .delete(projects)
        .where(inArray(projects.customer_id, customerIds));
      await db.delete(customers).where(inArray(customers.id, customerIds));
    }
    const memberIds = [ownerMemberId, inactiveMemberId].filter(Boolean);
    const userIds = [ownerUserId, inactiveUserId].filter(Boolean);
    if (memberIds.length > 0) {
      await db
        .delete(workspaceMembers)
        .where(inArray(workspaceMembers.id, memberIds));
    }
    if (userIds.length > 0) {
      await db.delete(users).where(inArray(users.id, userIds));
    }
  }, 60_000);

  it("creates an open task for the project owner and logs the creation on the customer", async () => {
    const created = await createTask(projectAlphaSite, taskInput(), writer());
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(created.task).toMatchObject({
      projectId: projectAlphaSite,
      status: TaskStatus.Open,
      assigneeMemberId: ownerMemberId,
      completedAt: null,
      completedByMemberId: null,
      version: 1,
    });
    const history = await taskActivities(projectAlphaSite);
    expect(history).toContainEqual(
      expect.objectContaining({
        type: ActivityType.Created,
        customerId: customerAlpha,
        metadata: expect.objectContaining({
          entity: "task",
          task_id: created.task.id,
        }),
      }),
    );
  });

  it("refuses an invisible customer-side task in the handler and at the database", async () => {
    const viaHandler = await createTask(
      projectAlphaSite,
      taskInput({
        actionSide: TaskActionSide.Customer,
        visibleToCustomer: false,
      }),
      writer(),
    );
    expect(viaHandler).toMatchObject({
      ok: false,
      code: TaskErrorCode.ValidationError,
    });

    await expect(
      db.insert(tasks).values({
        id: randomUUID(),
        project_id: projectAlphaSite,
        title: `${FIXTURE_PREFIX}bypass`,
        description: "",
        status: TaskStatus.Open,
        action_side: TaskActionSide.Customer,
        visible_to_customer: false,
        assignee_member_id: ownerMemberId,
        due_on: null,
        completed_at: null,
        completed_by_member_id: null,
        version: 1,
      }),
    ).rejects.toThrow();
  });

  it("rejects an inactive assignee on create and update", async () => {
    const onCreate = await createTask(
      projectAlphaSite,
      taskInput({ assigneeMemberId: inactiveMemberId }),
      writer(),
    );
    expect(onCreate).toEqual({
      ok: false,
      code: TaskErrorCode.AssigneeNotActive,
    });

    const created = await createTask(projectAlphaSite, taskInput(), writer());
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const onUpdate = await updateTask(
      created.task.id,
      updateInput({
        assigneeMemberId: inactiveMemberId,
        version: created.task.version,
      }),
      writer(),
    );
    expect(onUpdate).toEqual({
      ok: false,
      code: TaskErrorCode.AssigneeNotActive,
    });
  });

  it("stamps completion when done, clears it on reopening and logs every change", async () => {
    const created = await createTask(projectBetaSite, taskInput(), writer());
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const done = await changeTaskStatus(
      created.task.id,
      { status: TaskStatus.Done, version: created.task.version },
      writer(),
    );
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    expect(done.task).toMatchObject({
      status: TaskStatus.Done,
      completedByMemberId: ownerMemberId,
      version: 2,
    });
    expect(done.task.completedAt).not.toBeNull();

    const unchanged = await changeTaskStatus(
      created.task.id,
      { status: TaskStatus.Done, version: done.task.version },
      writer(),
    );
    expect(unchanged).toMatchObject({ ok: true, task: { version: 2 } });

    const reopened = await changeTaskStatus(
      created.task.id,
      { status: TaskStatus.InProgress, version: done.task.version },
      writer(),
    );
    expect(reopened.ok).toBe(true);
    if (!reopened.ok) return;
    expect(reopened.task).toMatchObject({
      status: TaskStatus.InProgress,
      completedAt: null,
      completedByMemberId: null,
      version: 3,
    });

    const statusChanges = (await taskActivities(projectBetaSite)).filter(
      (entry) => entry.type === ActivityType.StatusChange,
    );
    expect(statusChanges).toHaveLength(2);
  });

  it("answers a stale version with the current state and changes nothing", async () => {
    const created = await createTask(projectBetaSite, taskInput(), writer());
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    await changeTaskStatus(
      created.task.id,
      { status: TaskStatus.InProgress, version: 1 },
      writer(),
    );

    const stale = await changeTaskStatus(
      created.task.id,
      { status: TaskStatus.Cancelled, version: 1 },
      writer(),
    );

    expect(stale).toMatchObject({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: { currentVersion: 2 },
    });
    const [row] = await db
      .select({ status: tasks.status })
      .from(tasks)
      .where(eq(tasks.id, created.task.id));
    expect(row.status).toBe(TaskStatus.InProgress);
  });

  it("logs assignee, side and visibility changes but nothing for an edit of the text only", async () => {
    const created = await createTask(projectAlphaShop, taskInput(), writer());
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const before = (await taskActivities(projectAlphaShop)).length;

    const textOnly = await updateTask(
      created.task.id,
      updateInput({ title: `${FIXTURE_PREFIX}renamed`, version: 1 }),
      writer(),
    );
    expect(textOnly.ok).toBe(true);
    expect((await taskActivities(projectAlphaShop)).length).toBe(before);

    const sideChange = await updateTask(
      created.task.id,
      updateInput({
        actionSide: TaskActionSide.Customer,
        visibleToCustomer: true,
        version: 2,
      }),
      writer(),
    );
    expect(sideChange.ok).toBe(true);
    const fields = (await taskActivities(projectAlphaShop))
      .filter((entry) => entry.type === ActivityType.FieldChange)
      .map((entry) => (entry.metadata as { field: string }).field)
      .sort();
    expect(fields).toEqual(["action_side", "visible_to_customer"]);
  });

  it("lists open tasks first, soonest due first, undated last, then closed ones", async () => {
    const project = await createProject(customerAlpha, "ordering");
    const make = async (title: string, dueOn: string | null) => {
      const result = await createTask(
        project,
        taskInput({ title: `${FIXTURE_PREFIX}${title}`, dueOn }),
        writer(),
      );
      if (!result.ok) throw new Error("fixture task was rejected");
      return result.task;
    };
    const later = await make("later", "2099-01-01");
    const undated = await make("undated", null);
    const overdue = await make("overdue", "2000-01-01");
    const closed = await make("closed", "1999-01-01");
    await changeTaskStatus(
      closed.id,
      { status: TaskStatus.Cancelled, version: closed.version },
      writer(),
    );

    const listed = await listProjectTasks(
      project,
      actor({ permissions: new Set([Permission.TasksRead]) }),
    );

    expect(listed?.map((task) => task.id)).toEqual([
      overdue.id,
      later.id,
      undated.id,
      closed.id,
    ]);
  });

  it("scopes reads: workspace, customer binding and project binding see exactly their share", async () => {
    const workspaceReader = actor({
      permissions: new Set([Permission.TasksRead]),
    });
    const customerReader = customerBoundActor(
      customerAlpha,
      Permission.TasksRead,
    );
    const projectReader = projectBoundActor(
      projectAlphaSite,
      customerAlpha,
      Permission.TasksRead,
    );

    expect(await listProjectTasks(projectAlphaSite, workspaceReader)).not.toBe(
      null,
    );
    expect(await listProjectTasks(projectAlphaShop, customerReader)).not.toBe(
      null,
    );
    expect(await listProjectTasks(projectAlphaSite, projectReader)).not.toBe(
      null,
    );
    // Foreign customer and a sibling project of the bound customer answer like a missing project.
    expect(await listProjectTasks(projectBetaSite, customerReader)).toBe(null);
    expect(await listProjectTasks(projectAlphaShop, projectReader)).toBe(null);
    expect(await listProjectTasks(randomUUID(), workspaceReader)).toBe(null);

    const projectsSeenByCustomerReader = new Set(
      (await listCustomerTasks(customerAlpha, customerReader)).map(
        (task) => task.projectId,
      ),
    );
    expect(projectsSeenByCustomerReader.has(projectAlphaSite)).toBe(true);
    expect(projectsSeenByCustomerReader.has(projectBetaSite)).toBe(false);

    const projectsSeenByProjectReader = new Set(
      (await listCustomerTasks(customerAlpha, projectReader)).map(
        (task) => task.projectId,
      ),
    );
    expect([...projectsSeenByProjectReader]).toEqual([projectAlphaSite]);

    expect(await listCustomerTasks(customerBeta, customerReader)).toEqual([]);
  });

  it("scopes writes: a foreign customer or project cannot create, edit or change the status", async () => {
    const created = await createTask(projectAlphaSite, taskInput(), writer());
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const foreignCustomer = customerBoundActor(
      customerBeta,
      Permission.TasksWrite,
    );
    const siblingProject = projectBoundActor(
      projectAlphaShop,
      customerAlpha,
      Permission.TasksWrite,
    );

    for (const foreign of [foreignCustomer, siblingProject]) {
      expect(await createTask(projectAlphaSite, taskInput(), foreign)).toEqual({
        ok: false,
        code: TaskErrorCode.ProjectNotFound,
      });
      expect(
        await changeTaskStatus(
          created.task.id,
          { status: TaskStatus.Done, version: created.task.version },
          foreign,
        ),
      ).toEqual({ ok: false, code: TaskErrorCode.TaskNotFound });
      expect(
        await updateTask(
          created.task.id,
          updateInput({ version: created.task.version }),
          foreign,
        ),
      ).toEqual({ ok: false, code: TaskErrorCode.TaskNotFound });
    }

    const [row] = await db
      .select({ status: tasks.status, version: tasks.version })
      .from(tasks)
      .where(
        and(
          eq(tasks.id, created.task.id),
          eq(tasks.project_id, projectAlphaSite),
        ),
      );
    expect(row).toEqual({ status: TaskStatus.Open, version: 1 });
  });

  describe("task overview", () => {
    const TODAY = "2026-09-21";
    const reader = () =>
      actor({ permissions: new Set([Permission.TasksRead]) });
    let overviewCustomer: string;
    let openProject: string;
    let archivedProject: string;

    beforeAll(async () => {
      overviewCustomer = await createCustomer("overview");
      openProject = await createProject(overviewCustomer, "overview open");
      archivedProject = await createProject(
        overviewCustomer,
        "overview archived",
      );
      await db
        .update(projects)
        .set({ status: ProjectStatus.Archived })
        .where(eq(projects.id, archivedProject));

      const make = async (
        project: string,
        title: string,
        dueOn: string | null,
      ) => {
        const result = await createTask(
          project,
          taskInput({ title: `${FIXTURE_PREFIX}${title}`, dueOn }),
          writer(),
        );
        if (!result.ok) throw new Error("fixture task was rejected");
        return result.task;
      };
      await make(openProject, "overdue one", "2026-09-10");
      await make(openProject, "due today", TODAY);
      await make(openProject, "due next week", "2026-09-27");
      await make(openProject, "far away", "2026-12-24");
      await make(openProject, "undated", null);
      const finished = await make(openProject, "finished", "2026-09-01");
      await changeTaskStatus(
        finished.id,
        { status: TaskStatus.Done, version: finished.version },
        writer(),
      );
      await make(archivedProject, "in archived project", "2026-09-05");
    }, 60_000);

    it("lists tasks with customer and project names and a count that matches the rows", async () => {
      const result = await listTasks(
        { ...DEFAULT_TASK_LIST_FILTERS, customerId: overviewCustomer },
        reader(),
        TODAY,
      );

      expect(result.total).toBe(5);
      expect(result.rows).toHaveLength(5);
      expect(result.rows[0]).toMatchObject({
        customerId: overviewCustomer,
        customerDisplayName: `${FIXTURE_PREFIX}customer:overview`,
        projectTitle: `${FIXTURE_PREFIX}overview open`,
      });
      // Soonest due first, undated last, the archived project's and the finished task stay out.
      expect(
        result.rows.map((row) => row.task.title.replace(FIXTURE_PREFIX, "")),
      ).toEqual([
        "overdue one",
        "due today",
        "due next week",
        "far away",
        "undated",
      ]);
    });

    it("applies the period filters with the caller's business day", async () => {
      const titles = async (period: TaskListPeriod) =>
        (
          await listTasks(
            {
              ...DEFAULT_TASK_LIST_FILTERS,
              customerId: overviewCustomer,
              period,
            },
            reader(),
            TODAY,
          )
        ).rows.map((row) => row.task.title.replace(FIXTURE_PREFIX, ""));

      expect(await titles(TaskListPeriod.Overdue)).toEqual(["overdue one"]);
      expect(await titles(TaskListPeriod.Today)).toEqual(["due today"]);
      expect(await titles(TaskListPeriod.Week)).toEqual([
        "due today",
        "due next week",
      ]);
      expect(await titles(TaskListPeriod.DueSoon)).toEqual([
        "overdue one",
        "due today",
        "due next week",
      ]);
    });

    it("shows closed tasks and archived projects only when asked", async () => {
      const result = await listTasks(
        {
          ...DEFAULT_TASK_LIST_FILTERS,
          customerId: overviewCustomer,
          includeClosedProjects: true,
          status: TaskListStatusFilter.All,
        },
        reader(),
        TODAY,
      );

      expect(result.total).toBe(7);
    });

    it("searches titles, treating wildcards as plain text", async () => {
      const found = await listTasks(
        {
          ...DEFAULT_TASK_LIST_FILTERS,
          customerId: overviewCustomer,
          search: "TODAY",
        },
        reader(),
        TODAY,
      );
      const wildcard = await listTasks(
        {
          ...DEFAULT_TASK_LIST_FILTERS,
          customerId: overviewCustomer,
          search: "%",
        },
        reader(),
        TODAY,
      );

      expect(found.rows.map((row) => row.task.title)).toEqual([
        `${FIXTURE_PREFIX}due today`,
      ]);
      expect(wildcard.total).toBe(0);
    });

    it("keeps a filter from reaching beyond the access scope", async () => {
      const foreignReader = customerBoundActor(
        customerAlpha,
        Permission.TasksRead,
      );

      const result = await listTasks(
        { ...DEFAULT_TASK_LIST_FILTERS, customerId: overviewCustomer },
        foreignReader,
        TODAY,
      );

      expect(result).toMatchObject({ rows: [], total: 0 });
      expect(
        await listTasks(DEFAULT_TASK_LIST_FILTERS, actor(), TODAY),
      ).toMatchObject({ rows: [], total: 0 });
    });

    it("resolves the assignee shortcut to the acting member", async () => {
      const mine = await listTasks(
        {
          ...DEFAULT_TASK_LIST_FILTERS,
          assignee: "me",
          customerId: overviewCustomer,
        },
        reader(),
        TODAY,
      );
      const someoneElse = await listTasks(
        {
          ...DEFAULT_TASK_LIST_FILTERS,
          assignee: inactiveMemberId,
          customerId: overviewCustomer,
        },
        reader(),
        TODAY,
      );

      expect(mine.total).toBe(5);
      expect(someoneElse.total).toBe(0);
    });

    it("lists only the actor's own overdue and soon-due tasks for the dashboard, overdue first", async () => {
      const mine = await listMyDueTasks(reader(), TODAY);
      const ours = mine
        .filter((row) => row.customerId === overviewCustomer)
        .map((row) => row.task.title.replace(FIXTURE_PREFIX, ""));

      const overdueFlags = mine.map((row) => (row.task.dueOn ?? "") < TODAY);

      expect(mine.length).toBeLessThanOrEqual(10);
      expect(overdueFlags).toEqual([...overdueFlags].sort().reverse());
      expect(
        mine.every((row) => (row.task.dueOn ?? "9999") <= "2026-09-28"),
      ).toBe(true);
      expect(ours).not.toContain("far away");
      expect(ours).not.toContain("undated");
      expect(ours).not.toContain("finished");
      expect(
        mine.every((row) => row.task.assigneeMemberId === ownerMemberId),
      ).toBe(true);
      expect(
        await listMyDueTasks(
          { ...reader(), workspaceMemberId: inactiveMemberId },
          TODAY,
        ),
      ).not.toContainEqual(
        expect.objectContaining({ customerId: overviewCustomer }),
      );
    });
  });
});
