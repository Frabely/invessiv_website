import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PATCH } from "@/app/api/workspace/crm/customers/[id]/route";
import { GET, POST } from "@/app/api/workspace/crm/customers/route";
import {
  authorizedWorkspaceRequest,
  notMemberWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";
import {
  createCustomerRequestFixture,
  customerDetailFixture,
  TEST_CUSTOMER_ID,
  updateCustomerRequestFixture,
} from "@/server/tests/workspace/crm/support/crm-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}));

vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/query-handler/list-customers.query-handler",
  () => ({ listCustomers: mocks.listCustomers }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/create-customer.command-handler",
  () => ({ createCustomer: mocks.createCustomer }),
);
vi.mock(
  "@/server/workspace/crm/command-handler/update-customer.command-handler",
  () => ({ updateCustomer: mocks.updateCustomer }),
);

const COLLECTION_URL = "http://localhost/api/workspace/crm/customers";
const context = { params: Promise.resolve({ id: TEST_CUSTOMER_ID }) };

function jsonRequest(method: HttpMethod, body: string): NextRequest {
  return new Request(COLLECTION_URL, {
    method,
    body,
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
  }) as unknown as NextRequest;
}

function createRequest(body: unknown = createCustomerRequestFixture()) {
  return jsonRequest(HttpMethod.Post, JSON.stringify(body));
}

describe("CRM customer routes", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /crm/customers", () => {
    it("answers 401 without a session", async () => {
      mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());

      expect((await POST(createRequest())).status).toBe(
        HttpResponseCode.Unauthorized,
      );
      expect(mocks.createCustomer).not.toHaveBeenCalled();
    });

    it("answers 404 without workspace membership", async () => {
      mocks.authenticate.mockResolvedValue(notMemberWorkspaceRequest());

      expect((await POST(createRequest())).status).toBe(
        HttpResponseCode.NotFound,
      );
    });

    it("answers 403 without customers.write", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.CustomersRead]),
      );

      expect((await POST(createRequest())).status).toBe(
        HttpResponseCode.Forbidden,
      );
      expect(mocks.createCustomer).not.toHaveBeenCalled();
    });

    it("answers 201 with the created customer", async () => {
      mocks.createCustomer.mockResolvedValue({
        ok: true,
        customer: customerDetailFixture(),
      });

      const response = await POST(createRequest());

      expect(response.status).toBe(HttpResponseCode.Created);
      await expect(response.json()).resolves.toEqual({
        customer: customerDetailFixture(),
      });
      expect(mocks.createCustomer).toHaveBeenCalledWith(
        createCustomerRequestFixture(),
        expect.objectContaining({ workspaceMemberId: "member-actor-uuid" }),
      );
    });

    it("answers 400 for a body that is not JSON", async () => {
      const response = await POST(jsonRequest(HttpMethod.Post, "{"));

      expect(response.status).toBe(HttpResponseCode.BadRequest);
      expect(mocks.createCustomer).not.toHaveBeenCalled();
    });

    it("answers 422 with the issues for a validation error", async () => {
      const issues = [{ code: "custom", path: ["displayName"], message: "x" }];
      mocks.createCustomer.mockResolvedValue({
        ok: false,
        code: CustomerErrorCode.ValidationError,
        errors: issues,
      });

      const response = await POST(createRequest());

      expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
      await expect(response.json()).resolves.toMatchObject({
        error: CustomerErrorCode.ValidationError,
        details: issues,
      });
    });

    it.each([
      CustomerErrorCode.DisplayNameTaken,
      CustomerErrorCode.OwnerInactive,
    ])("answers 409 for %s", async (code) => {
      mocks.createCustomer.mockResolvedValue({ ok: false, code });

      const response = await POST(createRequest());

      expect(response.status).toBe(HttpResponseCode.Conflict);
      await expect(response.json()).resolves.toMatchObject({ error: code });
    });

    it("answers 500 and logs without the request body on unexpected failures", async () => {
      mocks.createCustomer.mockRejectedValue(new Error("db down"));

      const response = await POST(createRequest());

      expect(response.status).toBe(HttpResponseCode.InternalServerError);
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
        "anna@nordlicht.example",
      );
    });
  });

  describe("GET /crm/customers", () => {
    it("answers 403 without customers.read and 200 with the rows", async () => {
      mocks.authenticate.mockResolvedValueOnce(
        authorizedWorkspaceRequest([Permission.LeadsRead]),
      );
      const request = new Request(COLLECTION_URL) as unknown as NextRequest;
      expect((await GET(request)).status).toBe(HttpResponseCode.Forbidden);

      mocks.listCustomers.mockResolvedValue({ rows: [] });
      const response = await GET(request);
      expect(response.status).toBe(HttpResponseCode.Ok);
      await expect(response.json()).resolves.toEqual({ rows: [] });
    });
  });

  describe("PATCH /crm/customers/[id]", () => {
    const UPDATE_REQUEST = updateCustomerRequestFixture();
    const patchRequest = () =>
      jsonRequest(HttpMethod.Patch, JSON.stringify(UPDATE_REQUEST));

    it("answers 403 without customers.write", async () => {
      mocks.authenticate.mockResolvedValue(
        authorizedWorkspaceRequest([Permission.CustomersRead]),
      );

      expect((await PATCH(patchRequest(), context)).status).toBe(
        HttpResponseCode.Forbidden,
      );
      expect(mocks.updateCustomer).not.toHaveBeenCalled();
    });

    it("answers 200 with the updated customer", async () => {
      mocks.updateCustomer.mockResolvedValue({
        ok: true,
        customer: customerDetailFixture({ version: 2 }),
      });

      const response = await PATCH(patchRequest(), context);

      expect(response.status).toBe(HttpResponseCode.Ok);
      expect(mocks.updateCustomer).toHaveBeenCalledWith(
        TEST_CUSTOMER_ID,
        UPDATE_REQUEST,
      );
    });

    it("answers 404 for an unknown customer", async () => {
      mocks.updateCustomer.mockResolvedValue({
        ok: false,
        code: CustomerErrorCode.CustomerNotFound,
      });

      expect((await PATCH(patchRequest(), context)).status).toBe(
        HttpResponseCode.NotFound,
      );
    });

    it("answers 409 with the VersionConflictDto as body", async () => {
      const conflict = {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 4,
        current: customerDetailFixture({ version: 4 }),
      };
      mocks.updateCustomer.mockResolvedValue({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        conflict,
      });

      const response = await PATCH(patchRequest(), context);

      expect(response.status).toBe(HttpResponseCode.Conflict);
      await expect(response.json()).resolves.toEqual(conflict);
    });
  });
});
