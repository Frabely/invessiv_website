import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import {
  GET,
  POST,
} from "@/app/api/workspace/crm/projects/[projectId]/time-entries/route";
import { DELETE, PATCH } from "@/app/api/workspace/crm/time-entries/[id]/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const ENTRY_ID = "55555555-5555-4555-8555-555555555555";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listProjectTimeEntries: vi.fn(),
  createTimeEntry: vi.fn(),
  updateTimeEntry: vi.fn(),
  deleteTimeEntry: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-project-time-entries.query-handler",
  () => ({ listProjectTimeEntries: mocks.listProjectTimeEntries }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-time-entry.command-handler",
  () => ({ createTimeEntry: mocks.createTimeEntry }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-time-entry.command-handler",
  () => ({ updateTimeEntry: mocks.updateTimeEntry }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/delete-time-entry.command-handler",
  () => ({ deleteTimeEntry: mocks.deleteTimeEntry }),
);

const COLLECTION_URL = `http://localhost/api/workspace/crm/projects/${PROJECT_ID}/time-entries`;
const DETAIL_URL = `http://localhost/api/workspace/crm/time-entries/${ENTRY_ID}`;
const collectionContext = {
  params: Promise.resolve({ projectId: PROJECT_ID }),
};
const detailContext = { params: Promise.resolve({ id: ENTRY_ID }) };

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

// `nextUrl` only exists on a NextRequest; the list route reads its cursor from it.
function getRequest(url: string): NextRequest {
  return Object.assign(new Request(url), {
    nextUrl: new URL(url),
  }) as unknown as NextRequest;
}

const timeEntry = {
  id: ENTRY_ID,
  projectId: PROJECT_ID,
  taskId: null,
  performedOn: "2026-10-08",
  durationMinutes: 60,
  description: "Umbau Hero-Section",
  billable: true,
  performedByMemberId: "member-actor-uuid",
  version: 1,
  createdAt: "2026-10-08T10:00:00.000Z",
  updatedAt: "2026-10-08T10:00:00.000Z",
};
const project = {
  projectId: PROJECT_ID,
  allocatedMinutes: 300,
  usedMinutes: 60,
  goodwillMinutes: 0,
  remainingMinutes: 240,
  releasableMinutes: 240,
};
const body = JSON.stringify({
  performedOn: "2026-10-08",
  durationMinutes: 60,
  description: "Umbau Hero-Section",
  billable: true,
  taskId: null,
});

describe("CRM time entry routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /crm/projects/[projectId]/time-entries", () => {
    it("answers 401 without a session and 403 without hours.read anywhere", async () => {
      mocks.authenticate.mockResolvedValueOnce(
        unauthenticatedWorkspaceRequest(),
      );
      expect(
        (await GET(getRequest(COLLECTION_URL), collectionContext)).status,
      ).toBe(HttpResponseCode.Unauthorized);

      mocks.authenticate.mockResolvedValueOnce(
        authorizedWorkspaceRequest([Permission.TasksRead]),
      );
      expect(
        (await GET(getRequest(COLLECTION_URL), collectionContext)).status,
      ).toBe(HttpResponseCode.Forbidden);
      expect(mocks.listProjectTimeEntries).not.toHaveBeenCalled();
    });

    it("returns one page and passes the cursor on", async () => {
      const page = { entries: [timeEntry], nextCursor: null };
      mocks.listProjectTimeEntries.mockResolvedValue({ ok: true, page });

      const response = await GET(
        getRequest(`${COLLECTION_URL}?cursor=abc`),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual(page);
      expect(mocks.listProjectTimeEntries).toHaveBeenCalledWith(
        PROJECT_ID,
        { cursor: "abc" },
        expect.anything(),
      );
    });

    it("answers 404 for a project out of reach and 422 for a broken cursor", async () => {
      mocks.listProjectTimeEntries.mockResolvedValueOnce({
        ok: false,
        code: HoursErrorCode.ProjectNotFound,
      });
      mocks.listProjectTimeEntries.mockResolvedValueOnce({
        ok: false,
        code: HoursErrorCode.ValidationError,
      });

      expect(
        (await GET(getRequest(COLLECTION_URL), collectionContext)).status,
      ).toBe(HttpResponseCode.NotFound);
      expect(
        (await GET(getRequest(COLLECTION_URL), collectionContext)).status,
      ).toBe(HttpResponseCode.UnprocessableContent);
    });
  });

  describe("POST /crm/projects/[projectId]/time-entries", () => {
    it("answers 403 with hours.read alone", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.HoursRead]),
      );

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, body),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.createTimeEntry).not.toHaveBeenCalled();
    });

    it("books the entry and returns the project's new figures", async () => {
      mocks.createTimeEntry.mockResolvedValue({ ok: true, timeEntry, project });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, body),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Created);
      expect(await response.json()).toEqual({ timeEntry, project });
    });

    it.each([
      [HoursErrorCode.ProjectClosed, HttpResponseCode.Conflict],
      [HoursErrorCode.TaskNotLinkable, HttpResponseCode.UnprocessableContent],
      [HoursErrorCode.ProjectNotFound, HttpResponseCode.NotFound],
    ])("maps %s to %i", async (code, status) => {
      mocks.createTimeEntry.mockResolvedValue({ ok: false, code });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, body),
        collectionContext,
      );

      expect(response.status).toBe(status);
      expect(await response.json()).toMatchObject({ error: code });
    });

    it("answers 400 for a body that is no JSON and 500 without leaking the failure", async () => {
      expect(
        (
          await POST(
            jsonRequest(COLLECTION_URL, HttpMethod.Post, "{"),
            collectionContext,
          )
        ).status,
      ).toBe(HttpResponseCode.BadRequest);

      mocks.createTimeEntry.mockRejectedValue(new Error("boom"));
      const failed = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, body),
        collectionContext,
      );
      expect(failed.status).toBe(HttpResponseCode.InternalServerError);
      expect(JSON.stringify(await failed.json())).not.toContain("boom");
    });
  });

  describe("PATCH and DELETE /crm/time-entries/[id]", () => {
    const conflict = {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: 2,
      current: { ...timeEntry, version: 2 },
    };

    it("updates the entry", async () => {
      mocks.updateTimeEntry.mockResolvedValue({ ok: true, timeEntry, project });

      const response = await PATCH(
        jsonRequest(DETAIL_URL, HttpMethod.Patch, body),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ timeEntry, project });
    });

    it("answers 409 with the current entry on a stale update or delete", async () => {
      mocks.updateTimeEntry.mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict,
      });
      mocks.deleteTimeEntry.mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict,
      });

      const updated = await PATCH(
        jsonRequest(DETAIL_URL, HttpMethod.Patch, body),
        detailContext,
      );
      const deleted = await DELETE(
        jsonRequest(DETAIL_URL, HttpMethod.Delete, '{"version":1}'),
        detailContext,
      );

      expect(updated.status).toBe(HttpResponseCode.Conflict);
      expect(await updated.json()).toEqual(conflict);
      expect(deleted.status).toBe(HttpResponseCode.Conflict);
      expect(await deleted.json()).toEqual(conflict);
    });

    it("deletes the entry and returns the project's new figures", async () => {
      mocks.deleteTimeEntry.mockResolvedValue({
        ok: true,
        deleted: true,
        project,
      });

      const response = await DELETE(
        jsonRequest(DETAIL_URL, HttpMethod.Delete, '{"version":1}'),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ deleted: true, project });
      expect(mocks.deleteTimeEntry).toHaveBeenCalledWith(
        ENTRY_ID,
        { version: 1 },
        expect.anything(),
      );
    });

    it("answers 404 for an entry out of reach and 403 without hours.write", async () => {
      mocks.deleteTimeEntry.mockResolvedValue({
        ok: false,
        code: HoursErrorCode.TimeEntryNotFound,
      });
      expect(
        (
          await DELETE(
            jsonRequest(DETAIL_URL, HttpMethod.Delete, '{"version":1}'),
            detailContext,
          )
        ).status,
      ).toBe(HttpResponseCode.NotFound);

      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.HoursRead]),
      );
      expect(
        (
          await PATCH(
            jsonRequest(DETAIL_URL, HttpMethod.Patch, body),
            detailContext,
          )
        ).status,
      ).toBe(HttpResponseCode.Forbidden);
    });
  });
});
