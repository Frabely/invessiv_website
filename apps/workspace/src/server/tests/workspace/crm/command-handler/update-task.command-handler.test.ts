import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import { updateTask } from "@/server/workspace/crm/command-handler/update-task.command-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  limit: vi.fn(),
  updateVersioned: vi.fn(),
  isActiveMember: vi.fn(),
  recordFieldChanges: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));
vi.mock("@/server/workspace/crm/services/task-assignee-service", () => ({
  taskAssigneeService: { isActiveMember: mocks.isActiveMember },
}));
vi.mock("@/server/workspace/crm/services/task-activity-service", () => ({
  taskActivityService: { recordFieldChanges: mocks.recordFieldChanges },
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_PROJECT_ID = "44444444-4444-4444-8444-444444444444";
const TASK_ID = "66666666-6666-4666-8666-666666666666";
const CURRENT_ASSIGNEE_ID = "77777777-7777-4777-8777-777777777777";
const NEW_ASSIGNEE_ID = "88888888-8888-4888-8888-888888888888";

function updateInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Zugangsdaten bereitstellen",
    description: "",
    actionSide: TaskActionSide.Internal,
    visibleToCustomer: false,
    assigneeMemberId: CURRENT_ASSIGNEE_ID,
    dueOn: null,
    version: 3,
    ...overrides,
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

describe("updateTask", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.limit.mockResolvedValue([
      {
        customerId: CUSTOMER_ID,
        projectId: PROJECT_ID,
        assigneeMemberId: CURRENT_ASSIGNEE_ID,
        actionSide: TaskActionSide.Customer,
        visibleToCustomer: true,
      },
    ]);
    mocks.isActiveMember.mockResolvedValue(true);
    mocks.updateVersioned.mockResolvedValue({
      ok: true,
      value: { id: TASK_ID, version: 4 },
    });
    mocks.getDatabase.mockReturnValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({ limit: mocks.limit })),
          })),
        })),
      })),
      transaction: (callback: (tx: unknown) => unknown) => callback({}),
    });
  });

  it("writes through the versioned helper and never touches the status or the project", async () => {
    const result = await updateTask(
      TASK_ID,
      updateInput(),
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(result).toEqual({ ok: true, task: { id: TASK_ID, version: 4 } });
    const call = mocks.updateVersioned.mock.calls[0][0] as {
      expectedVersion: number;
      patch: Record<string, unknown>;
    };
    expect(call.expectedVersion).toBe(3);
    expect(call.patch).not.toHaveProperty("status");
    expect(call.patch).not.toHaveProperty("project_id");
    expect(call.patch).not.toHaveProperty("completed_at");
  });

  it("records the tracked field changes with the previous and the new values", async () => {
    await updateTask(
      TASK_ID,
      updateInput({ assigneeMemberId: NEW_ASSIGNEE_ID }),
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(mocks.recordFieldChanges).toHaveBeenCalledWith(
      expect.anything(),
      { customerId: CUSTOMER_ID, projectId: PROJECT_ID, taskId: TASK_ID },
      expect.anything(),
      {
        previous: {
          assigneeMemberId: CURRENT_ASSIGNEE_ID,
          actionSide: TaskActionSide.Customer,
          visibleToCustomer: true,
        },
        next: {
          assigneeMemberId: NEW_ASSIGNEE_ID,
          actionSide: TaskActionSide.Internal,
          visibleToCustomer: false,
        },
      },
    );
  });

  it("rejects an inactive new assignee without writing", async () => {
    mocks.isActiveMember.mockResolvedValue(false);

    const result = await updateTask(
      TASK_ID,
      updateInput({ assigneeMemberId: NEW_ASSIGNEE_ID }),
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(result).toEqual({
      ok: false,
      code: TaskErrorCode.AssigneeNotActive,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("does not re-check an assignee that stays the same", async () => {
    mocks.isActiveMember.mockResolvedValue(false);

    const result = await updateTask(
      TASK_ID,
      updateInput(),
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(result.ok).toBe(true);
    expect(mocks.isActiveMember).not.toHaveBeenCalled();
  });

  it("returns not-found for a malformed id and validation issues for a bad body", async () => {
    const actor = workspaceActorWith([Permission.TasksWrite]);

    expect(await updateTask("not-a-uuid", updateInput(), actor)).toEqual({
      ok: false,
      code: TaskErrorCode.TaskNotFound,
    });
    expect(
      await updateTask(
        TASK_ID,
        updateInput({
          actionSide: TaskActionSide.Customer,
          visibleToCustomer: false,
        }),
        actor,
      ),
    ).toMatchObject({ ok: false, code: TaskErrorCode.ValidationError });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("answers not-found for a task that does not exist", async () => {
    mocks.limit.mockResolvedValue([]);

    const result = await updateTask(
      TASK_ID,
      updateInput(),
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(result).toEqual({ ok: false, code: TaskErrorCode.TaskNotFound });
  });

  it("accepts a customer binding covering the owning project", async () => {
    const result = await updateTask(
      TASK_ID,
      updateInput(),
      actorWithCustomerBinding(CUSTOMER_ID),
    );

    expect(result.ok).toBe(true);
  });

  it("refuses a binding for another customer or another project", async () => {
    for (const actor of [
      actorWithCustomerBinding(OTHER_CUSTOMER_ID),
      actorWithProjectBinding(OTHER_PROJECT_ID),
    ]) {
      expect(await updateTask(TASK_ID, updateInput(), actor)).toEqual({
        ok: false,
        code: TaskErrorCode.TaskNotFound,
      });
    }
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("maps a deleted row to not-found and passes a version conflict through", async () => {
    mocks.updateVersioned.mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });
    expect(
      await updateTask(
        TASK_ID,
        updateInput(),
        workspaceActorWith([Permission.TasksWrite]),
      ),
    ).toEqual({ ok: false, code: TaskErrorCode.TaskNotFound });

    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 7,
      current: { id: TASK_ID, version: 7 },
    };
    mocks.updateVersioned.mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
    expect(
      await updateTask(
        TASK_ID,
        updateInput(),
        workspaceActorWith([Permission.TasksWrite]),
      ),
    ).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
    expect(mocks.recordFieldChanges).not.toHaveBeenCalled();
  });
});
