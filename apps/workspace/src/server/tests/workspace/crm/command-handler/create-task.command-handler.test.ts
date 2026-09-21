import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import { createTask } from "@/server/workspace/crm/command-handler/create-task.command-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  limit: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
  isActiveMember: vi.fn(),
  recordCreated: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/crm/services/task-assignee-service", () => ({
  taskAssigneeService: { isActiveMember: mocks.isActiveMember },
}));
vi.mock("@/server/workspace/crm/services/task-activity-service", () => ({
  taskActivityService: { recordCreated: mocks.recordCreated },
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_PROJECT_ID = "44444444-4444-4444-8444-444444444444";
const OWNER_ID = "77777777-7777-4777-8777-777777777777";
const OTHER_MEMBER_ID = "88888888-8888-4888-8888-888888888888";
const TASK_ID = "66666666-6666-4666-8666-666666666666";

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Zugangsdaten bereitstellen",
    description: "",
    actionSide: TaskActionSide.Customer,
    visibleToCustomer: true,
    assigneeMemberId: null,
    dueOn: "2026-10-01",
    ...overrides,
  };
}

function createdRow() {
  return {
    id: TASK_ID,
    project_id: PROJECT_ID,
    title: "Zugangsdaten bereitstellen",
    description: "",
    status: TaskStatus.Open,
    action_side: TaskActionSide.Customer,
    visible_to_customer: true,
    assignee_member_id: OWNER_ID,
    due_on: "2026-10-01",
    completed_at: null,
    completed_by_member_id: null,
    version: 1,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
  };
}

function actorWithCustomerBinding(customerId: string): WorkspaceActor {
  return {
    ...workspaceActorWith([]),
    customerPermissions: new Map([
      [customerId, new Set([Permission.TasksWrite])],
    ]),
  };
}

function actorWithProjectBinding(projectId: string): WorkspaceActor {
  return {
    ...workspaceActorWith([]),
    projectPermissions: new Map([
      [
        projectId,
        {
          customerId: CUSTOMER_ID,
          permissions: new Set([Permission.TasksWrite]),
        },
      ],
    ]),
  };
}

describe("createTask", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.limit.mockResolvedValue([
      { customerId: CUSTOMER_ID, ownerMemberId: OWNER_ID },
    ]);
    mocks.isActiveMember.mockResolvedValue(true);
    mocks.values.mockReturnValue({ returning: mocks.returning });
    mocks.returning.mockResolvedValue([createdRow()]);
    const tx = { insert: vi.fn(() => ({ values: mocks.values })) };
    mocks.getDatabase.mockReturnValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: mocks.limit })),
        })),
      })),
      transaction: (callback: (transaction: unknown) => unknown) =>
        callback(tx),
    });
  });

  it("creates an open task, defaults the assignee to the project owner and logs it", async () => {
    const result = await createTask(
      PROJECT_ID,
      createInput(),
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(result).toMatchObject({ ok: true, task: { id: TASK_ID } });
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: PROJECT_ID,
        status: TaskStatus.Open,
        assignee_member_id: OWNER_ID,
        completed_at: null,
        completed_by_member_id: null,
        version: 1,
      }),
    );
    expect(mocks.recordCreated).toHaveBeenCalledWith(
      expect.anything(),
      { customerId: CUSTOMER_ID, projectId: PROJECT_ID, taskId: TASK_ID },
      expect.anything(),
    );
  });

  it("uses the explicit assignee when one is given and active", async () => {
    await createTask(
      PROJECT_ID,
      createInput({ assigneeMemberId: OTHER_MEMBER_ID }),
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(mocks.isActiveMember).toHaveBeenCalledWith(
      expect.anything(),
      OTHER_MEMBER_ID,
    );
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({ assignee_member_id: OTHER_MEMBER_ID }),
    );
  });

  it("rejects an inactive assignee without inserting or logging", async () => {
    mocks.isActiveMember.mockResolvedValue(false);

    const result = await createTask(
      PROJECT_ID,
      createInput({ assigneeMemberId: OTHER_MEMBER_ID }),
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(result).toEqual({
      ok: false,
      code: TaskErrorCode.AssigneeNotActive,
    });
    expect(mocks.values).not.toHaveBeenCalled();
    expect(mocks.recordCreated).not.toHaveBeenCalled();
  });

  it("returns not-found for a malformed project id and validation issues for a bad body", async () => {
    const actor = workspaceActorWith([Permission.TasksWrite]);

    expect(await createTask("not-a-uuid", createInput(), actor)).toEqual({
      ok: false,
      code: TaskErrorCode.ProjectNotFound,
    });
    expect(
      await createTask(
        PROJECT_ID,
        createInput({ visibleToCustomer: false }),
        actor,
      ),
    ).toMatchObject({ ok: false, code: TaskErrorCode.ValidationError });
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("answers not-found for an unknown project", async () => {
    mocks.limit.mockResolvedValue([]);

    expect(
      await createTask(
        PROJECT_ID,
        createInput(),
        workspaceActorWith([Permission.TasksWrite]),
      ),
    ).toEqual({ ok: false, code: TaskErrorCode.ProjectNotFound });
  });

  it("accepts a customer binding covering the project", async () => {
    const result = await createTask(
      PROJECT_ID,
      createInput(),
      actorWithCustomerBinding(CUSTOMER_ID),
    );

    expect(result.ok).toBe(true);
  });

  it("refuses read-only access and bindings for another customer or project", async () => {
    for (const actor of [
      workspaceActorWith([Permission.TasksRead]),
      actorWithCustomerBinding(OTHER_CUSTOMER_ID),
      actorWithProjectBinding(OTHER_PROJECT_ID),
    ]) {
      expect(await createTask(PROJECT_ID, createInput(), actor)).toEqual({
        ok: false,
        code: TaskErrorCode.ProjectNotFound,
      });
    }
    expect(mocks.values).not.toHaveBeenCalled();
  });
});
