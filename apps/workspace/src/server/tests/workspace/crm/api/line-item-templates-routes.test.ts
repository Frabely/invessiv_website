import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PATCH } from "@/app/api/workspace/crm/line-item-templates/[id]/route";
import { GET, POST } from "@/app/api/workspace/crm/line-item-templates/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const LINE_ITEM_TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-000000000001";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listLineItemTemplates: vi.fn(),
  createLineItemTemplate: vi.fn(),
  updateLineItemTemplate: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-line-item-templates.query-handler",
  () => ({ listLineItemTemplates: mocks.listLineItemTemplates }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-line-item-template.command-handler",
  () => ({ createLineItemTemplate: mocks.createLineItemTemplate }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-line-item-template.command-handler",
  () => ({ updateLineItemTemplate: mocks.updateLineItemTemplate }),
);

const COLLECTION_URL = "http://localhost/api/workspace/crm/line-item-templates";
const context = { params: Promise.resolve({ id: LINE_ITEM_TEMPLATE_ID }) };

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

const templateFixture = {
  id: LINE_ITEM_TEMPLATE_ID,
  title: "Landingpage",
  description: "",
  priceCents: 150000,
  pricingMode: "one_time",
  recurringInterval: null,
  status: "active",
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("CRM line item template routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /crm/line-item-templates", () => {
    it("answers 401 without a session", async () => {
      mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
      );

      expect(response.status).toBe(HttpResponseCode.Unauthorized);
      expect(mocks.listLineItemTemplates).not.toHaveBeenCalled();
    });

    it("answers 403 without line_item_templates.read", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.CustomersRead]),
      );

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
    });

    it("returns the list result on success", async () => {
      mocks.listLineItemTemplates.mockResolvedValue({
        hasLineItemTemplates: true,
        page: 1,
        perPage: 25,
        rows: [templateFixture],
        total: 1,
      });

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({
        hasLineItemTemplates: true,
        page: 1,
        perPage: 25,
        rows: [templateFixture],
        total: 1,
      });
      expect(mocks.listLineItemTemplates).toHaveBeenCalledWith({
        includeArchived: false,
        page: 1,
      });
    });

    it("forwards page and archived filters from the query string", async () => {
      mocks.listLineItemTemplates.mockResolvedValue({
        hasLineItemTemplates: true,
        page: 2,
        perPage: 25,
        rows: [],
        total: 30,
      });

      await GET(
        new Request(
          `${COLLECTION_URL}?page=2&includeArchived=true`,
        ) as unknown as NextRequest,
      );

      expect(mocks.listLineItemTemplates).toHaveBeenCalledWith({
        includeArchived: true,
        page: 2,
      });
    });
  });

  describe("POST /crm/line-item-templates", () => {
    it("answers 403 without line_item_templates.write", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.LineItemTemplatesRead]),
      );

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, "{}"),
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.createLineItemTemplate).not.toHaveBeenCalled();
    });

    it("maps a validation failure to 422", async () => {
      mocks.createLineItemTemplate.mockResolvedValue({
        ok: false,
        code: LineItemTemplateErrorCode.ValidationError,
        errors: [],
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, "{}"),
      );

      expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
    });

    it("returns the created template with 201", async () => {
      mocks.createLineItemTemplate.mockResolvedValue({
        ok: true,
        lineItemTemplate: templateFixture,
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, "{}"),
      );

      expect(response.status).toBe(HttpResponseCode.Created);
      expect(await response.json()).toEqual({
        lineItemTemplate: templateFixture,
      });
    });
  });

  describe("PATCH /crm/line-item-templates/:id", () => {
    it("answers 409 on a version conflict", async () => {
      const conflict = {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 2,
        current: templateFixture,
      };
      mocks.updateLineItemTemplate.mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict,
      });

      const response = await PATCH(
        jsonRequest(
          `${COLLECTION_URL}/${LINE_ITEM_TEMPLATE_ID}`,
          HttpMethod.Patch,
          "{}",
        ),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.Conflict);
      expect(await response.json()).toEqual(conflict);
    });

    it("answers 404 for an unknown template", async () => {
      mocks.updateLineItemTemplate.mockResolvedValue({
        ok: false,
        code: LineItemTemplateErrorCode.LineItemTemplateNotFound,
      });

      const response = await PATCH(
        jsonRequest(
          `${COLLECTION_URL}/${LINE_ITEM_TEMPLATE_ID}`,
          HttpMethod.Patch,
          "{}",
        ),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
    });
  });
});
