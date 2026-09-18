import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PATCH } from "@/app/api/workspace/crm/service-templates/[id]/route";
import { GET, POST } from "@/app/api/workspace/crm/service-templates/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const SERVICE_TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-000000000001";

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listServiceTemplates: vi.fn(),
  createServiceTemplate: vi.fn(),
  updateServiceTemplate: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-service-templates.query-handler",
  () => ({ listServiceTemplates: mocks.listServiceTemplates }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-service-template.command-handler",
  () => ({ createServiceTemplate: mocks.createServiceTemplate }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-service-template.command-handler",
  () => ({ updateServiceTemplate: mocks.updateServiceTemplate }),
);

const COLLECTION_URL = "http://localhost/api/workspace/crm/service-templates";
const context = { params: Promise.resolve({ id: SERVICE_TEMPLATE_ID }) };

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
  id: SERVICE_TEMPLATE_ID,
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

describe("CRM service template routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /crm/service-templates", () => {
    it("answers 401 without a session", async () => {
      mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
      );

      expect(response.status).toBe(HttpResponseCode.Unauthorized);
      expect(mocks.listServiceTemplates).not.toHaveBeenCalled();
    });

    it("answers 403 without services.read", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.CustomersRead]),
      );

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
    });

    it("returns the list result on success", async () => {
      mocks.listServiceTemplates.mockResolvedValue({
        hasServiceTemplates: true,
        rows: [templateFixture],
      });

      const response = await GET(
        new Request(COLLECTION_URL) as unknown as NextRequest,
      );

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(await response.json()).toEqual({
        hasServiceTemplates: true,
        rows: [templateFixture],
      });
    });
  });

  describe("POST /crm/service-templates", () => {
    it("answers 403 without services.write", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.ServicesRead]),
      );

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, "{}"),
      );

      expect(response.status).toBe(HttpResponseCode.Forbidden);
      expect(mocks.createServiceTemplate).not.toHaveBeenCalled();
    });

    it("maps a validation failure to 422", async () => {
      mocks.createServiceTemplate.mockResolvedValue({
        ok: false,
        code: ServiceTemplateErrorCode.ValidationError,
        errors: [],
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, "{}"),
      );

      expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
    });

    it("returns the created template with 201", async () => {
      mocks.createServiceTemplate.mockResolvedValue({
        ok: true,
        serviceTemplate: templateFixture,
      });

      const response = await POST(
        jsonRequest(COLLECTION_URL, HttpMethod.Post, "{}"),
      );

      expect(response.status).toBe(HttpResponseCode.Created);
      expect(await response.json()).toEqual({
        serviceTemplate: templateFixture,
      });
    });
  });

  describe("PATCH /crm/service-templates/:id", () => {
    it("answers 409 on a version conflict", async () => {
      const conflict = {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 2,
        current: templateFixture,
      };
      mocks.updateServiceTemplate.mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict,
      });

      const response = await PATCH(
        jsonRequest(
          `${COLLECTION_URL}/${SERVICE_TEMPLATE_ID}`,
          HttpMethod.Patch,
          "{}",
        ),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.Conflict);
      expect(await response.json()).toEqual(conflict);
    });

    it("answers 404 for an unknown template", async () => {
      mocks.updateServiceTemplate.mockResolvedValue({
        ok: false,
        code: ServiceTemplateErrorCode.ServiceTemplateNotFound,
      });

      const response = await PATCH(
        jsonRequest(
          `${COLLECTION_URL}/${SERVICE_TEMPLATE_ID}`,
          HttpMethod.Patch,
          "{}",
        ),
        context,
      );

      expect(response.status).toBe(HttpResponseCode.NotFound);
    });
  });
});
