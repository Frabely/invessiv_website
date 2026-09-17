import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { POST } from "@/app/api/workspace/crm/leads/[leadId]/convert/route";
import {
  authorizedWorkspaceRequest,
  unauthenticatedWorkspaceRequest,
} from "@/server/tests/support/workspace-auth-fixtures";
import {
  createCustomerRequestFixture,
  TEST_CUSTOMER_ID,
} from "@/server/tests/workspace/crm/support/crm-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), convert: vi.fn() }));
vi.mock("@/lib/auth/workspace-authentication", () => ({
  authenticateWorkspaceRequest: mocks.authenticate,
}));
vi.mock(
  "@/server/workspace/crm/command-handler/convert-lead-to-customer.command-handler",
  () => ({ convertLeadToCustomer: mocks.convert }),
);

const LEAD_ID = "11111111-1111-4111-8111-111111111111";
const URL = `http://localhost/api/workspace/crm/leads/${LEAD_ID}/convert`;
const context = { params: Promise.resolve({ leadId: LEAD_ID }) };

function request(body = JSON.stringify(createCustomerRequestFixture())) {
  return new Request(URL, {
    method: HttpMethod.Post,
    body,
    headers: { [HttpHeaderName.ContentType]: MediaType.Json },
  }) as unknown as NextRequest;
}

describe("POST /crm/leads/[leadId]/convert", () => {
  beforeEach(() => {
    mocks.authenticate.mockReset();
    mocks.convert.mockReset();
    mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest());
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("answers 401 without a session", async () => {
    mocks.authenticate.mockResolvedValue(unauthenticatedWorkspaceRequest());
    expect((await POST(request(), context)).status).toBe(
      HttpResponseCode.Unauthorized,
    );
  });

  it.each([Permission.CustomersWrite, Permission.LeadsWrite])(
    "answers 403 without %s",
    async (missing) => {
      const granted = [Permission.CustomersWrite, Permission.LeadsWrite].filter(
        (permission) => permission !== missing,
      );
      mocks.authenticate.mockResolvedValue(authorizedWorkspaceRequest(granted));
      expect((await POST(request(), context)).status).toBe(
        HttpResponseCode.Forbidden,
      );
    },
  );

  it("answers 400 for malformed JSON", async () => {
    expect((await POST(request("{"), context)).status).toBe(
      HttpResponseCode.BadRequest,
    );
  });

  it("answers 404 for an invalid lead id without calling the command", async () => {
    const invalidContext = { params: Promise.resolve({ leadId: "invalid" }) };

    expect((await POST(request(), invalidContext)).status).toBe(
      HttpResponseCode.NotFound,
    );
    expect(mocks.convert).not.toHaveBeenCalled();
  });

  it("answers 422 for an invalid body without calling the command", async () => {
    expect(
      (await POST(request(JSON.stringify({ displayName: "" })), context))
        .status,
    ).toBe(HttpResponseCode.UnprocessableContent);
    expect(mocks.convert).not.toHaveBeenCalled();
  });

  it("answers 201 with the customer id", async () => {
    mocks.convert.mockResolvedValue({
      ok: true,
      customerId: TEST_CUSTOMER_ID,
    });
    const response = await POST(request(), context);
    expect(response.status).toBe(HttpResponseCode.Created);
    await expect(response.json()).resolves.toEqual({
      customerId: TEST_CUSTOMER_ID,
    });
  });

  it.each([
    [LeadConversionErrorCode.LeadNotFound, HttpResponseCode.NotFound],
    [LeadConversionErrorCode.DisplayNameTaken, HttpResponseCode.Conflict],
    [
      LeadConversionErrorCode.ValidationError,
      HttpResponseCode.UnprocessableContent,
    ],
  ])("maps %s to %s", async (code, status) => {
    mocks.convert.mockResolvedValue({ ok: false, code });
    expect((await POST(request(), context)).status).toBe(status);
  });
});
