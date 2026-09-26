import { afterEach, describe, expect, it, vi } from "vitest";

import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { TaskDto } from "@invessiv/common/contracts/crm/task.dto";
import { tasksApiService } from "@/client/crm/tasks-api-service";

const TASK: TaskDto = {
  id: "66666666-6666-4666-8666-666666666666",
  projectId: "33333333-3333-4333-8333-333333333333",
  title: "Logo liefern",
  description: "",
  status: TaskStatus.Open,
  actionSide: TaskActionSide.Internal,
  visibleToCustomer: false,
  assigneeMemberId: "77777777-7777-4777-8777-777777777777",
  dueOn: null,
  completedAt: null,
  completedByMemberId: null,
  completedByCustomer: false,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function respondWith(status: number, body: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("tasksApiService", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts a new task to its project and returns it", async () => {
    const fetchMock = respondWith(HttpResponseCode.Created, { task: TASK });

    await expect(
      tasksApiService.createTask(TASK.projectId, {
        title: "Logo liefern",
        description: "",
        actionSide: TaskActionSide.Internal,
        visibleToCustomer: false,
        assigneeMemberId: null,
        dueOn: null,
      }),
    ).resolves.toEqual({ ok: true, task: TASK });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/workspace/crm/projects/${TASK.projectId}/tasks`,
      expect.objectContaining({ method: HttpMethod.Post }),
    );
  });

  it("patches the task and its status on their own endpoints", async () => {
    const fetchMock = respondWith(HttpResponseCode.Ok, { task: TASK });

    await tasksApiService.updateTask(TASK.id, {
      title: "Logo liefern",
      description: "",
      actionSide: TaskActionSide.Internal,
      visibleToCustomer: false,
      assigneeMemberId: TASK.assigneeMemberId,
      dueOn: null,
      version: 1,
    });
    await tasksApiService.changeTaskStatus(TASK.id, {
      status: TaskStatus.Done,
      version: 1,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      `/api/workspace/crm/tasks/${TASK.id}`,
      expect.objectContaining({ method: HttpMethod.Patch }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `/api/workspace/crm/tasks/${TASK.id}/status`,
      expect.objectContaining({ method: HttpMethod.Patch }),
    );
  });

  it("maps a known error code and falls back to internal for an unknown one", async () => {
    respondWith(HttpResponseCode.UnprocessableContent, {
      error: TaskErrorCode.AssigneeNotActive,
    });
    await expect(
      tasksApiService.changeTaskStatus(TASK.id, {
        status: TaskStatus.Done,
        version: 1,
      }),
    ).resolves.toEqual({ ok: false, code: TaskErrorCode.AssigneeNotActive });

    respondWith(HttpResponseCode.InternalServerError, { error: "SOMETHING" });
    await expect(
      tasksApiService.changeTaskStatus(TASK.id, {
        status: TaskStatus.Done,
        version: 1,
      }),
    ).resolves.toEqual({ ok: false, code: TaskErrorCode.Internal });
  });

  it("returns the fresh state on a version conflict", async () => {
    respondWith(HttpResponseCode.Conflict, {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 2,
      current: { ...TASK, version: 2 },
    });

    await expect(
      tasksApiService.changeTaskStatus(TASK.id, {
        status: TaskStatus.Done,
        version: 1,
      }),
    ).resolves.toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: { ...TASK, version: 2 },
    });
  });

  it("reports the internal error code when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(
      tasksApiService.changeTaskStatus(TASK.id, {
        status: TaskStatus.Done,
        version: 1,
      }),
    ).resolves.toEqual({ ok: false, code: TaskErrorCode.Internal });
  });
});
