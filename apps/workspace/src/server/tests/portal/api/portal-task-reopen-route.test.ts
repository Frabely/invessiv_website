import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalTaskErrorCode } from "@invessiv/common/constants/portal/portal-task-error-codes";
import { POST } from "@/app/api/portal/[customerId]/tasks/[taskId]/reopen/route";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  reopenCustomerTask: vi.fn(),
}));

vi.mock("@/server/portal/auth/portal-authentication-service", () => ({
  portalAuthenticationService: {
    authenticateRequest: mocks.authenticateRequest,
  },
}));
vi.mock(
  "@/server/portal/command-handler/reopen-customer-task.command-handler",
  () => ({ reopenCustomerTask: mocks.reopenCustomerTask }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const TASK_ID = "66666666-6666-4666-8666-666666666666";
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([Permission.PortalAccess, Permission.PortalTasksReopen]),
  projectPermissions: new Map(),
});

function post(customerId = CUSTOMER_ID, taskId = TASK_ID) {
  return POST({} as NextRequest, {
    params: Promise.resolve({ customerId, taskId }),
  });
}

describe("POST /api/portal/[customerId]/tasks/[taskId]/reopen", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.authenticateRequest.mockResolvedValue({
      status: PortalAuthStatus.Authorized,
      actor: ACTOR,
    });
  });

  it("reopens through the verified actor and reports whether it was new", async () => {
    mocks.reopenCustomerTask.mockResolvedValue({
      ok: true,
      alreadyOpen: false,
    });

    const response = await post(CUSTOMER_ID.toUpperCase(), TASK_ID);

    expect(response.status).toBe(HttpResponseCode.Ok);
    await expect(response.json()).resolves.toEqual({ alreadyOpen: false });
    expect(mocks.authenticateRequest).toHaveBeenCalledWith(CUSTOMER_ID);
    expect(mocks.reopenCustomerTask).toHaveBeenCalledWith(ACTOR, TASK_ID);
  });

  it("answers 404 for every task the actor may not reopen", async () => {
    mocks.reopenCustomerTask.mockResolvedValue({
      ok: false,
      code: PortalTaskErrorCode.NotFound,
    });

    const response = await post();

    expect(response.status).toBe(HttpResponseCode.NotFound);
    await expect(response.json()).resolves.toMatchObject({
      code: PortalTaskErrorCode.NotFound,
    });
  });

  it("gives the owner view and other non-members no write path", async () => {
    mocks.authenticateRequest.mockResolvedValue({
      status: PortalAuthStatus.NotMember,
    });

    const response = await post();

    expect(response.status).toBe(HttpResponseCode.NotFound);
    expect(mocks.reopenCustomerTask).not.toHaveBeenCalled();
  });

  it("answers 503 without details when the database fails", async () => {
    mocks.reopenCustomerTask.mockRejectedValue(new Error("connection lost"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await post();

    expect(response.status).toBe(HttpResponseCode.ServiceUnavailable);
    await expect(response.json()).resolves.toMatchObject({
      code: PortalTaskErrorCode.Unavailable,
    });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "connection lost",
    );
    consoleError.mockRestore();
  });
});
