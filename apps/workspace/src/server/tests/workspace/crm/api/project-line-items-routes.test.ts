import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PATCH } from "@/app/api/workspace/crm/project-line-items/[id]/route";
import {
  GET,
  POST,
} from "@/app/api/workspace/crm/projects/[projectId]/line-items/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const PROJECT_LINE_ITEM_ID = "55555555-5555-4555-8555-555555555555";
const TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-00000000f001";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listProjectLineItems: vi.fn(),
  createProjectLineItem: vi.fn(),
  updateProjectLineItem: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-project-line-items.query-handler",
  () => ({ listProjectLineItems: mocks.listProjectLineItems }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-project-line-item.command-handler",
  () => ({ createProjectLineItem: mocks.createProjectLineItem }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-project-line-item.command-handler",
  () => ({ updateProjectLineItem: mocks.updateProjectLineItem }),
);

const COLLECTION_URL = `http://localhost/api/workspace/crm/projects/${PROJECT_ID}/services`;
const DETAIL_URL = `http://localhost/api/workspace/crm/project-line-items/${PROJECT_LINE_ITEM_ID}`;
const collectionContext = {
  params: Promise.resolve({ projectId: PROJECT_ID }),
};
const detailContext = { params: Promise.resolve({ id: PROJECT_LINE_ITEM_ID }) };

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

const projectLineItemFixture = {
  id: PROJECT_LINE_ITEM_ID,
  projectId: PROJECT_ID,
  sourceLineItemTemplateId: TEMPLATE_ID,
  title: "Landingpage",
  description: "",
  priceCents: 200000,
  pricingMode: ServicePricingMode.OneTime,
  recurringInterval: null,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const createBody = JSON.stringify({
  sourceLineItemTemplateId: TEMPLATE_ID,
  title: "Landingpage",
  description: "",
  priceCents: 200000,
  pricingMode: ServicePricingMode.OneTime,
  recurringInterval: null,
});

const updateBody = JSON.stringify({
  title: "Landingpage",
  description: "",
  priceCents: 180000,
  pricingMode: ServicePricingMode.OneTime,
  recurringInterval: null,
  version: 1,
});

describe("CRM project line item routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /crm/projects/[projectId]/services", () => {
    it("answers 401 without a session", async () => {
      mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Unauthorized);
      expect(mocks.listProjectLineItems).not.toHaveBeenCalled();
    });

    it("answers 403 without project_line_items.read anywhere", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.ProjectsRead]),
      );

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.listProjectLineItems).not.toHaveBeenCalled();
    });

    it("returns the services of a readable project", async () => {
      mocks.listProjectLineItems.mockResolvedValue([projectLineItemFixture]);

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({
        projectLineItems: [projectLineItemFixture],
      });
    });

    it("returns an empty list for a readable project without services", async () => {
      mocks.listProjectLineItems.mockResolvedValue([]);

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({ projectLineItems: [] });
    });

    it("answers 404 for a project outside the access scope", async () => {
      mocks.listProjectLineItems.mockResolvedValue(null);

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
      expect(await response.json()).toMatchObject({
        error: ProjectLineItemErrorCode.ProjectNotFound,
      });
    });

    it("answers 500 without leaking the failure", async () => {
      mocks.listProjectLineItems.mockRejectedValue(new Error("boom"));

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.InternalServerError);
      expect(await response.json()).toMatchObject({
        error: ProjectLineItemErrorCode.Internal,
      });
    });
  });

  describe("POST /crm/projects/[projectId]/services", () => {
    it("answers 403 without project_line_items.write anywhere", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.ProjectLineItemsRead]),
      );

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, createBody),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.createProjectLineItem).not.toHaveBeenCalled();
    });

    it("answers 400 for a body that is not JSON", async () => {
      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, "not json"),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.BadRequest);
      expect(mocks.createProjectLineItem).not.toHaveBeenCalled();
    });

    it("answers 201 with the created snapshot", async () => {
      mocks.createProjectLineItem.mockResolvedValue({
        ok: true,
        projectLineItem: projectLineItemFixture,
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, createBody),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.Created);
      expect(await response.json()).toEqual({
        projectLineItem: projectLineItemFixture,
      });
    });

    it("answers 404 for a project the actor may not write", async () => {
      mocks.createProjectLineItem.mockResolvedValue({
        ok: false,
        code: ProjectLineItemErrorCode.ProjectNotFound,
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, createBody),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
    });

    it("answers 422 for an archived template", async () => {
      mocks.createProjectLineItem.mockResolvedValue({
        ok: false,
        code: ProjectLineItemErrorCode.LineItemTemplateNotAssignable,
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, createBody),
        collectionContext,
      );

      expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
      expect(await response.json()).toMatchObject({
        error: ProjectLineItemErrorCode.LineItemTemplateNotAssignable,
      });
    });
  });

  describe("PATCH /crm/project-line-items/[id]", () => {
    it("answers 403 without project_line_items.write anywhere", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.ProjectLineItemsRead]),
      );

      const response = await PATCH(
        jsonRequest(DETAIL_URL, HttpMethod.Patch, updateBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.updateProjectLineItem).not.toHaveBeenCalled();
    });

    it("answers 200 with the updated snapshot", async () => {
      mocks.updateProjectLineItem.mockResolvedValue({
        ok: true,
        projectLineItem: { ...projectLineItemFixture, version: 2 },
      });

      const response = await PATCH(
        jsonRequest(DETAIL_URL, HttpMethod.Patch, updateBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({
        projectLineItem: { ...projectLineItemFixture, version: 2 },
      });
    });

    it("answers 409 with the conflict body so the dialog keeps the input", async () => {
      const conflict = {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 4,
        current: { ...projectLineItemFixture, version: 4 },
      };
      mocks.updateProjectLineItem.mockResolvedValue({
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

    it("answers 404 for a foreign project line item", async () => {
      mocks.updateProjectLineItem.mockResolvedValue({
        ok: false,
        code: ProjectLineItemErrorCode.ProjectLineItemNotFound,
      });

      const response = await PATCH(
        jsonRequest(DETAIL_URL, HttpMethod.Patch, updateBody),
        detailContext,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
    });
  });
});
