import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import { POST } from "@/app/api/portal/[customerId]/tasks/route";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  createCustomerRequestTask: vi.fn(),
}));

vi.mock("@/server/portal/auth/portal-authentication-service", () => ({
  portalAuthenticationService: {
    authenticateRequest: mocks.authenticateRequest,
  },
}));
vi.mock(
  "@/server/portal/command-handler/create-customer-request-task.command-handler",
  () => ({ createCustomerRequestTask: mocks.createCustomerRequestTask }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const FOREIGN_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const BODY = {
  projectId: "33333333-3333-4333-8333-333333333333",
  title: "Add opening hours",
  description: "",
  dueOn: null,
};
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([Permission.PortalAccess, Permission.PortalTasksCreate]),
  projectPermissions: new Map(),
});

function post(body: unknown, customerId = CUSTOMER_ID) {
  const request = {
    json: async () => {
      if (body === undefined) throw new SyntaxError("Unexpected end of input");
      return body;
    },
  } as unknown as NextRequest;
  return POST(request, { params: Promise.resolve({ customerId }) });
}

describe("POST /api/portal/[customerId]/tasks", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticateRequest.mockResolvedValue({
      status: PortalAuthStatus.Authorized,
      actor: ACTOR,
    });
  });

  it("creates through the verified actor and only confirms", async () => {
    mocks.createCustomerRequestTask.mockResolvedValue({
      ok: true,
      taskId: "66666666-6666-4666-8666-666666666666",
    });

    const response = await post(BODY, CUSTOMER_ID.toUpperCase());

    expect(response.status).toBe(HttpResponseCode.Created);
    await expect(response.json()).resolves.toEqual({ created: true });
    expect(mocks.authenticateRequest).toHaveBeenCalledWith(CUSTOMER_ID);
    expect(mocks.createCustomerRequestTask).toHaveBeenCalledWith(ACTOR, BODY);
  });

  it("never passes a customer id from the body to the command", async () => {
    mocks.createCustomerRequestTask.mockResolvedValue({
      ok: false,
      code: PortalTaskErrorCode.NotFound,
    });

    await post({ ...BODY, customerId: FOREIGN_CUSTOMER_ID });

    const [actor] = mocks.createCustomerRequestTask.mock.calls[0] as [
      typeof ACTOR,
    ];
    expect(actor.customerId).toBe(CUSTOMER_ID);
  });

  it.each([
    [PortalTaskErrorCode.NotFound, HttpResponseCode.NotFound],
    [PortalTaskErrorCode.Validation, HttpResponseCode.UnprocessableContent],
    [PortalTaskErrorCode.NoAssignee, HttpResponseCode.Conflict],
    [PortalTaskErrorCode.LimitReached, HttpResponseCode.Conflict],
  ])("maps %s to %i", async (code, status) => {
    mocks.createCustomerRequestTask.mockResolvedValue({ ok: false, code });

    const response = await post(BODY);

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ code });
  });

  it("rejects a body that is not JSON before the command runs", async () => {
    const response = await post(undefined);

    expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
    expect(mocks.createCustomerRequestTask).not.toHaveBeenCalled();
  });

  it("gives the owner view and members of another company no write path", async () => {
    mocks.authenticateRequest.mockResolvedValue({
      status: PortalAuthStatus.NotMember,
    });

    const response = await post(BODY, FOREIGN_CUSTOMER_ID);

    expect(response.status).toBe(HttpResponseCode.NotFound);
    expect(mocks.createCustomerRequestTask).not.toHaveBeenCalled();
  });

  it("answers 503 without details when the database fails", async () => {
    mocks.createCustomerRequestTask.mockRejectedValue(
      new Error("connection lost"),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await post(BODY);

    expect(response.status).toBe(HttpResponseCode.ServiceUnavailable);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "connection lost",
    );
    consoleError.mockRestore();
  });
});
