import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { PortalServiceRequestErrorCode as E } from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import { POST as withdraw } from "@/app/api/portal/[customerId]/service-requests/[requestId]/withdraw/route";
import { POST as create } from "@/app/api/portal/[customerId]/service-requests/route";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "@/server/portal/auth/portal-actor";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  createPortalServiceRequest: vi.fn(),
  withdrawPortalServiceRequest: vi.fn(),
}));

vi.mock("@/server/portal/auth/portal-authentication-service", () => ({
  portalAuthenticationService: {
    authenticateRequest: mocks.authenticateRequest,
  },
}));
vi.mock(
  "@/server/portal/command-handler/create-portal-service-request.command-handler",
  () => ({ createPortalServiceRequest: mocks.createPortalServiceRequest }),
);
vi.mock(
  "@/server/portal/command-handler/withdraw-portal-service-request.command-handler",
  () => ({ withdrawPortalServiceRequest: mocks.withdrawPortalServiceRequest }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const FOREIGN_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const REQUEST_ID = "33333333-3333-4333-8333-333333333333";
const BODY = {
  idempotencyKey: "44444444-4444-4444-8444-444444444444",
  lineItemTemplateId: null,
  title: "Second landing page",
  note: "For the summer offer",
  requestedMinutes: null,
  projectWish: ServiceRequestProjectWish.New,
  projectId: null,
};
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalAccess,
    Permission.PortalServicesRequest,
  ]),
  projectPermissions: new Map(),
});

function postCreate(body: unknown, customerId = CUSTOMER_ID) {
  const request = {
    json: async () => {
      if (body === undefined) throw new SyntaxError("Unexpected end of input");
      return body;
    },
  } as unknown as NextRequest;
  return create(request, { params: Promise.resolve({ customerId }) });
}

function postWithdraw(requestId = REQUEST_ID, customerId = CUSTOMER_ID) {
  return withdraw({} as NextRequest, {
    params: Promise.resolve({ customerId, requestId }),
  });
}

beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.authenticateRequest.mockResolvedValue({
    status: PortalAuthStatus.Authorized,
    actor: ACTOR,
  });
});

describe("POST /api/portal/[customerId]/service-requests", () => {
  it("creates through the verified actor and only confirms", async () => {
    mocks.createPortalServiceRequest.mockResolvedValue({
      ok: true,
      requestId: REQUEST_ID,
    });

    const response = await postCreate(BODY, CUSTOMER_ID.toUpperCase());

    expect(response.status).toBe(HttpResponseCode.Created);
    await expect(response.json()).resolves.toEqual({ created: true });
    expect(mocks.authenticateRequest).toHaveBeenCalledWith(CUSTOMER_ID);
    expect(mocks.createPortalServiceRequest).toHaveBeenCalledWith(ACTOR, BODY);
  });

  it("takes the company from the session, whatever the body claims", async () => {
    mocks.createPortalServiceRequest.mockResolvedValue({
      ok: false,
      code: E.Validation,
    });

    await postCreate({ ...BODY, customerId: FOREIGN_CUSTOMER_ID });

    const [actor] = mocks.createPortalServiceRequest.mock.calls[0] as [
      typeof ACTOR,
    ];
    expect(actor.customerId).toBe(CUSTOMER_ID);
  });

  it.each([
    [E.NotFound, HttpResponseCode.NotFound],
    [E.Validation, HttpResponseCode.UnprocessableContent],
    [E.LimitReached, HttpResponseCode.Conflict],
    [E.DuplicateOpen, HttpResponseCode.Conflict],
  ])("maps %s to %i", async (code, status) => {
    mocks.createPortalServiceRequest.mockResolvedValue({ ok: false, code });

    const response = await postCreate(BODY);

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ code });
  });

  it("rejects a body that is not JSON before the command runs", async () => {
    const response = await postCreate(undefined);

    expect(response.status).toBe(HttpResponseCode.UnprocessableContent);
    expect(mocks.createPortalServiceRequest).not.toHaveBeenCalled();
  });

  it("gives the owner view and members of another company no write path", async () => {
    mocks.authenticateRequest.mockResolvedValue({
      status: PortalAuthStatus.NotMember,
    });

    const response = await postCreate(BODY, FOREIGN_CUSTOMER_ID);

    expect(response.status).toBe(HttpResponseCode.NotFound);
    expect(mocks.createPortalServiceRequest).not.toHaveBeenCalled();
  });

  it("answers 500 without details when the database fails", async () => {
    mocks.createPortalServiceRequest.mockRejectedValue(
      new Error("connection lost"),
    );
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await postCreate(BODY);

    expect(response.status).toBe(HttpResponseCode.InternalServerError);
    await expect(response.json()).resolves.toMatchObject({ code: E.Internal });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "connection lost",
    );
    consoleError.mockRestore();
  });
});

describe("POST /api/portal/[customerId]/service-requests/[requestId]/withdraw", () => {
  it("withdraws through the verified actor and only confirms", async () => {
    mocks.withdrawPortalServiceRequest.mockResolvedValue({
      ok: true,
      alreadyWithdrawn: false,
    });

    const response = await postWithdraw(REQUEST_ID.toUpperCase());

    expect(response.status).toBe(HttpResponseCode.Ok);
    await expect(response.json()).resolves.toEqual({ withdrawn: true });
    expect(mocks.withdrawPortalServiceRequest).toHaveBeenCalledWith(
      ACTOR,
      REQUEST_ID,
    );
  });

  it.each([
    [E.NotFound, HttpResponseCode.NotFound],
    [E.Locked, HttpResponseCode.Conflict],
  ])("maps %s to %i", async (code, status) => {
    mocks.withdrawPortalServiceRequest.mockResolvedValue({ ok: false, code });

    const response = await postWithdraw();

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ code });
  });

  it("answers 404 without a membership of the company", async () => {
    mocks.authenticateRequest.mockResolvedValue({
      status: PortalAuthStatus.NotMember,
    });

    const response = await postWithdraw(REQUEST_ID, FOREIGN_CUSTOMER_ID);

    expect(response.status).toBe(HttpResponseCode.NotFound);
    expect(mocks.withdrawPortalServiceRequest).not.toHaveBeenCalled();
  });
});
