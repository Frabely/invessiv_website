import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";
import { changeTaskStatus } from "@/server/workspace/crm/command-handler/change-task-status.command-handler";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  limit: vi.fn(),
  updateVersioned: vi.fn(),
  recordStatusChange: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));
vi.mock("@/server/workspace/crm/services/task-activity-service", () => ({
  taskActivityService: { recordStatusChange: mocks.recordStatusChange },
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_PROJECT_ID = "44444444-4444-4444-8444-444444444444";
const TASK_ID = "66666666-6666-4666-8666-666666666666";
const MEMBER_ID = "77777777-7777-4777-8777-777777777777";

function taskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TASK_ID,
    project_id: PROJECT_ID,
    title: "Zugangsdaten bereitstellen",
    description: "",
    status: TaskStatus.Open,
    action_side: TaskActionSide.Internal,
    visible_to_customer: false,
    assignee_member_id: MEMBER_ID,
    due_on: null,
    completed_at: null,
    completed_by_member_id: null,
    version: 3,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
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

describe("changeTaskStatus", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.limit.mockResolvedValue([
      { task: taskRow(), customerId: CUSTOMER_ID },
    ]);
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

  it("stamps completion time and member when the task becomes done", async () => {
    const actor = workspaceActorWith([Permission.TasksWrite]);

    const result = await changeTaskStatus(
      TASK_ID,
      { status: TaskStatus.Done, version: 3 },
      actor,
    );

    expect(result).toEqual({ ok: true, task: { id: TASK_ID, version: 4 } });
    const { patch, expectedVersion } = mocks.updateVersioned.mock
      .calls[0][0] as {
      patch: Record<string, unknown>;
      expectedVersion: number;
    };
    expect(expectedVersion).toBe(3);
    expect(patch).toMatchObject({
      status: TaskStatus.Done,
      completed_by_member_id: actor.workspaceMemberId,
    });
    expect(patch.completed_at).toBeInstanceOf(Date);
  });

  it("clears the completion data when a done task is reopened", async () => {
    mocks.limit.mockResolvedValue([
      {
        task: taskRow({
          status: TaskStatus.Done,
          completed_at: new Date(),
          completed_by_member_id: MEMBER_ID,
        }),
        customerId: CUSTOMER_ID,
      },
    ]);

    await changeTaskStatus(
      TASK_ID,
      { status: TaskStatus.InProgress, version: 3 },
      workspaceActorWith([Permission.TasksWrite]),
    );

    const { patch } = mocks.updateVersioned.mock.calls[0][0] as {
      patch: Record<string, unknown>;
    };
    expect(patch).toEqual({
      status: TaskStatus.InProgress,
      completed_at: null,
      completed_by_member_id: null,
      completed_by_portal_membership_id: null,
    });
  });

  it("replaces a portal completion origin when the team completes a reopened task", async () => {
    await changeTaskStatus(
      TASK_ID,
      { status: TaskStatus.Done, version: 3 },
      workspaceActorWith([Permission.TasksWrite]),
    );

    const { patch } = mocks.updateVersioned.mock.calls[0][0] as {
      patch: Record<string, unknown>;
    };
    expect(patch).toMatchObject({ completed_by_portal_membership_id: null });
  });

  it("records the previous and the new status", async () => {
    await changeTaskStatus(
      TASK_ID,
      { status: TaskStatus.Cancelled, version: 3 },
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(mocks.recordStatusChange).toHaveBeenCalledWith(
      expect.anything(),
      { customerId: CUSTOMER_ID, projectId: PROJECT_ID, taskId: TASK_ID },
      expect.anything(),
      { previous: TaskStatus.Open, next: TaskStatus.Cancelled },
    );
  });

  it("changes nothing and logs nothing when the status and version already match", async () => {
    const result = await changeTaskStatus(
      TASK_ID,
      { status: TaskStatus.Open, version: 3 },
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(result).toMatchObject({
      ok: true,
      task: { id: TASK_ID, status: TaskStatus.Open, version: 3 },
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
    expect(mocks.recordStatusChange).not.toHaveBeenCalled();
  });

  it("reports a version conflict when the status already matches but the version is stale", async () => {
    const result = await changeTaskStatus(
      TASK_ID,
      { status: TaskStatus.Open, version: 1 },
      workspaceActorWith([Permission.TasksWrite]),
    );

    expect(result).toMatchObject({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 3,
        current: { id: TASK_ID, status: TaskStatus.Open, version: 3 },
      },
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
    expect(mocks.recordStatusChange).not.toHaveBeenCalled();
  });

  it("returns not-found for a malformed id and validation issues for an unknown status", async () => {
    const actor = workspaceActorWith([Permission.TasksWrite]);

    expect(
      await changeTaskStatus(
        "not-a-uuid",
        { status: TaskStatus.Done, version: 1 },
        actor,
      ),
    ).toEqual({ ok: false, code: TaskErrorCode.TaskNotFound });
    expect(
      await changeTaskStatus(
        TASK_ID,
        { status: "blocked" as TaskStatus, version: 1 },
        actor,
      ),
    ).toMatchObject({ ok: false, code: TaskErrorCode.ValidationError });
  });

  it("refuses an actor without write access to the owning project", async () => {
    for (const actor of [
      workspaceActorWith([Permission.TasksRead]),
      actorWithProjectBinding(OTHER_PROJECT_ID),
      {
        ...workspaceActorWith([]),
        customerPermissions: new Map([
          [OTHER_CUSTOMER_ID, new Set([Permission.TasksWrite])],
        ]),
      },
    ]) {
      expect(
        await changeTaskStatus(
          TASK_ID,
          { status: TaskStatus.Done, version: 3 },
          actor,
        ),
      ).toEqual({ ok: false, code: TaskErrorCode.TaskNotFound });
    }
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("maps a deleted row to not-found and passes a version conflict through", async () => {
    mocks.updateVersioned.mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });
    expect(
      await changeTaskStatus(
        TASK_ID,
        { status: TaskStatus.Done, version: 3 },
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
      await changeTaskStatus(
        TASK_ID,
        { status: TaskStatus.Done, version: 3 },
        workspaceActorWith([Permission.TasksWrite]),
      ),
    ).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict,
    });
    expect(mocks.recordStatusChange).not.toHaveBeenCalled();
  });
});
