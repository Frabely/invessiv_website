import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "./portal-actor";
import { withPortalActor } from "./with-portal-actor";

vi.mock("server-only", () => ({}));

const { mockAuthenticate } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn(),
}));

vi.mock("./portal-authentication-service", () => ({
  portalAuthenticationService: { authenticateRequest: mockAuthenticate },
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([Permission.PortalAccess]),
  projectPermissions: new Map(),
});
const request = {} as NextRequest;

describe("withPortalActor", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
  });

  it("calls the handler with the resolved actor, never a raw customerId", async () => {
    mockAuthenticate.mockResolvedValue({
      status: PortalAuthStatus.Authorized,
      actor: ACTOR,
    });
    const handler = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));

    const response = await withPortalActor(CUSTOMER_ID, handler)(request);

    expect(handler).toHaveBeenCalledWith(request, ACTOR);
    expect(response.status).toBe(200);
    expect(mockAuthenticate).toHaveBeenCalledWith(CUSTOMER_ID);
  });

  it("answers 401 without a Clerk session", async () => {
    mockAuthenticate.mockResolvedValue({
      status: PortalAuthStatus.Unauthenticated,
    });
    const handler = vi.fn();

    const response = await withPortalActor(CUSTOMER_ID, handler)(request);

    expect(response.status).toBe(HttpResponseCode.Unauthorized);
    expect(handler).not.toHaveBeenCalled();
  });

  it("answers 404 without a membership for this customer", async () => {
    mockAuthenticate.mockResolvedValue({ status: PortalAuthStatus.NotMember });
    const handler = vi.fn();

    const response = await withPortalActor(CUSTOMER_ID, handler)(request);

    expect(response.status).toBe(HttpResponseCode.NotFound);
    expect(handler).not.toHaveBeenCalled();
  });

  it("answers 503 when authorization data is unavailable", async () => {
    mockAuthenticate.mockResolvedValue({
      status: PortalAuthStatus.Unavailable,
    });
    const handler = vi.fn();

    const response = await withPortalActor(CUSTOMER_ID, handler)(request);

    expect(response.status).toBe(HttpResponseCode.ServiceUnavailable);
    expect(handler).not.toHaveBeenCalled();
  });
});
