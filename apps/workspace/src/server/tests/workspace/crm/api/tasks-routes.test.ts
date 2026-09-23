import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { TaskErrorCode } from "@invessiv/common/constants/crm/errors/task-error-codes";
import { TaskActionSide } from "@invessiv/common/constants/crm/task-action-sides";
import { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import {
  GET,
  POST,
} from "@/app/api/workspace/crm/projects/[projectId]/tasks/route";
import { PATCH as PATCH_STATUS } from "@/app/api/workspace/crm/tasks/[id]/status/route";
import { PATCH } from "@/app/api/workspace/crm/tasks/[id]/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const TASK_ID = "66666666-6666-4666-8666-666666666666";
const MEMBER_ID = "77777777-7777-4777-8777-777777777777";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listProjectTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  changeTaskStatus: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-project-tasks.query-handler",
  () => ({ listProjectTasks: mocks.listProjectTasks }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-task.command-handler",
  () => ({ createTask: mocks.createTask }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-task.command-handler",
  () => ({ updateTask: mocks.updateTask }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/change-task-status.command-handler",
  () => ({ changeTaskStatus: mocks.changeTaskStatus }),
);

const COLLECTION_URL = `http://localhost/api/workspace/crm/projects/${PROJECT_ID}/tasks`;
const DETAIL_URL = `http://localhost/api/workspace/crm/tasks/${TASK_ID}`;
const STATUS_URL = `${DETAIL_URL}/status`;
const collectionContext = {
  params: Promise.resolve({ projectId: PROJECT_ID }),
};
const detailContext = { params: Promise.resolve({ id: TASK_ID }) };

function jsonRequest(
  url: string,
  method: HttpMethod,
  body: string,
): NextRequest {
  return new Request(url, {
    method,
    body,
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
  }) as unknown as NextRequest;
}

const taskFixture = {
  id: TASK_ID,
  projectId: PROJECT_ID,
  title: "Zugangsdaten bereitstellen",
  description: "",
  status: TaskStatus.Open,
  actionSide: TaskActionSide.Customer,
  visibleToCustomer: true,
  assigneeMemberId: MEMBER_ID,
  dueOn: "2026-10-01",
  completedAt: null,
  completedByMemberId: null,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const createBody = JSON.stringify({
  title: "Zugangsdaten bereitstellen",
  description: "",
  actionSide: TaskActionSide.Customer,
  visibleToCustomer: true,
  assigneeMemberId: null,
  dueOn: "2026-10-01",
});

const updateBody = JSON.stringify({
  title: "Zugangsdaten bereitstellen",
  description: "",
  actionSide: TaskActionSide.Internal,
  visibleToCustomer: false,
  assigneeMemberId: MEMBER_ID,
  dueOn: null,
  version: 1,
});

const statusBody = JSON.stringify({ status: TaskStatus.Done, version: 1 });

const conflict = {
  code: ConcurrencyErrorCode.VersionConflict,
  currentVersion: 4,
  current: { ...taskFixture, version: 4 },
};

describe("CRM task routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /crm/projects/[projectId]/tasks", () => {
    it("answers 401 without a session", async () => {
      mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Unauthorized);
      expect(mocks.listProjectTasks).not.toHaveBeenCalled();
    });

    it("answers 403 without tasks.read anywhere", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.TasksWrite]),
      );

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.listProjectTasks).not.toHaveBeenCalled();
    });

    it("returns the tasks of a readable project", async () => {
      mocks.listProjectTasks.mockResolvedValue([taskFixture]);

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ tasks: [taskFixture] });
    });

    it("returns an empty list for a readable project without tasks", async () => {
      mocks.listProjectTasks.mockResolvedValue([]);

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ tasks: [] });
    });

    it("answers 404 for a project outside the access scope", async () => {
      mocks.listProjectTasks.mockResolvedValue(null);

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
      expect(await response.json()).toMatchObject({
        error: TaskErrorCode.ProjectNotFound,
      });
    });

    it("answers 500 without leaking the failure", async () => {
      mocks.listProjectTasks.mockRejectedValue(new Error("boom"));

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.InternalServerError);
      expect(await response.json()).toMatchObject({
        error: TaskErrorCode.Internal,
      });
    });
  });

  describe("POST /crm/projects/[projectId]/tasks", () => {
    it("answers 403 without tasks.write anywhere", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.TasksRead]),
      );

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, createBody),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.createTask).not.toHaveBeenCalled();
    });

    it("answers 400 for a body that is not JSON", async () => {
      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, "not json"),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.BadRequest);
      expect(mocks.createTask).not.toHaveBeenCalled();
    });

    it("answers 201 with the created task", async () => {
      mocks.createTask.mockResolvedValue({ ok: true, task: taskFixture });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, createBody),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Created);
      expect(await response.json()).toEqual({ task: taskFixture });
    });

    it("answers 404 for a project the actor may not write", async () => {
      mocks.createTask.mockResolvedValue({
        ok: false,
        code: TaskErrorCode.ProjectNotFound,
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, createBody),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
    });

    it("answers 422 for an inactive assignee", async () => {
      mocks.createTask.mockResolvedValue({
        ok: false,
        code: TaskErrorCode.AssigneeNotActive,
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, createBody),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
      expect(await response.json()).toMatchObject({
        error: TaskErrorCode.AssigneeNotActive,
      });
    });

    it("answers 422 with the validation issues", async () => {
      mocks.createTask.mockResolvedValue({
        ok: false,
        code: TaskErrorCode.ValidationError,
        errors: [{ path: ["title"] }],
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, createBody),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
      expect(await response.json()).toMatchObject({
        error: TaskErrorCode.ValidationError,
        details: [{ path: ["title"] }],
      });
    });
  });

  describe("PATCH /crm/tasks/[id]", () => {
    it("answers 403 without tasks.write anywhere", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.TasksRead]),
      );

      const response = await PATCH(
        jsonRequest(DETAIL_URL, HttpMethod.Patch, updateBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.updateTask).not.toHaveBeenCalled();
    });

    it("answers 200 with the updated task", async () => {
      mocks.updateTask.mockResolvedValue({
        ok: true,
        task: { ...taskFixture, version: 2 },
      });

      const response = await PATCH(
        jsonRequest(DETAIL_URL, HttpMethod.Patch, updateBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({
        task: { ...taskFixture, version: 2 },
      });
    });

    it("answers 409 with the conflict body so the dialog keeps the input", async () => {
      mocks.updateTask.mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict,
      });

      const response = await PATCH(
        jsonRequest(DETAIL_URL, HttpMethod.Patch, updateBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Conflict);
      expect(await response.json()).toEqual(conflict);
    });

    it("answers 404 for a foreign task", async () => {
      mocks.updateTask.mockResolvedValue({
        ok: false,
        code: TaskErrorCode.TaskNotFound,
      });

      const response = await PATCH(
        jsonRequest(DETAIL_URL, HttpMethod.Patch, updateBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
    });
  });

  describe("PATCH /crm/tasks/[id]/status", () => {
    it("answers 403 without tasks.write anywhere", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.TasksRead]),
      );

      const response = await PATCH_STATUS(
        jsonRequest(STATUS_URL, HttpMethod.Patch, statusBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.changeTaskStatus).not.toHaveBeenCalled();
    });

    it("answers 400 for a body that is not JSON", async () => {
      const response = await PATCH_STATUS(
        jsonRequest(STATUS_URL, HttpMethod.Patch, "not json"),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.BadRequest);
      expect(mocks.changeTaskStatus).not.toHaveBeenCalled();
    });

    it("answers 200 with the task in its new status", async () => {
      const done = { ...taskFixture, status: TaskStatus.Done, version: 2 };
      mocks.changeTaskStatus.mockResolvedValue({ ok: true, task: done });

      const response = await PATCH_STATUS(
        jsonRequest(STATUS_URL, HttpMethod.Patch, statusBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ task: done });
    });

    it("answers 409 with the conflict body", async () => {
      mocks.changeTaskStatus.mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict,
      });

      const response = await PATCH_STATUS(
        jsonRequest(STATUS_URL, HttpMethod.Patch, statusBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Conflict);
      expect(await response.json()).toEqual(conflict);
    });

    it("answers 404 for a foreign task", async () => {
      mocks.changeTaskStatus.mockResolvedValue({
        ok: false,
        code: TaskErrorCode.TaskNotFound,
      });

      const response = await PATCH_STATUS(
        jsonRequest(STATUS_URL, HttpMethod.Patch, statusBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
    });
  });
});
