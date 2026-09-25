import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalActorResolutionError } from "@/common/constants/auth/portal-actor-resolution-errors";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "./portal-actor";
import { authenticatePortalRequest } from "./portal-authentication";

vi.mock("server-only", () => ({}));

const { mockAuth, mockResolve } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockResolve: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock(
  "@/server/portal/query-handler/resolve-portal-actor.query-handler",
  () => ({ resolvePortalActor: mockResolve }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  permissions: new Set([Permission.PortalAccess]),
  projectPermissions: new Map(),
});

describe("authenticatePortalRequest", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockResolve.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("is unauthenticated without a Clerk session", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(authenticatePortalRequest(CUSTOMER_ID)).resolves.toEqual({
      status: PortalAuthStatus.Unauthenticated,
    });
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it("is not_member for a malformed customer id, without querying the database", async () => {
    mockAuth.mockResolvedValue({ userId: "user_member" });

    await expect(authenticatePortalRequest("not-a-uuid")).resolves.toEqual({
      status: PortalAuthStatus.NotMember,
    });
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it("authorizes a resolved actor", async () => {
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockResolvedValue({ ok: true, actor: ACTOR });

    await expect(authenticatePortalRequest(CUSTOMER_ID)).resolves.toEqual({
      status: PortalAuthStatus.Authorized,
      actor: ACTOR,
    });
    expect(mockResolve).toHaveBeenCalledWith("user_member", CUSTOMER_ID);
  });

  it.each([
    PortalActorResolutionError.UserMissing,
    PortalActorResolutionError.UserInactive,
    PortalActorResolutionError.MembershipMissing,
    PortalActorResolutionError.AccessDenied,
  ])(
    "is not_member for resolution failure %s, confirming nothing",
    async (code) => {
      mockAuth.mockResolvedValue({ userId: "user_member" });
      mockResolve.mockResolvedValue({ ok: false, code });

      await expect(authenticatePortalRequest(CUSTOMER_ID)).resolves.toEqual({
        status: PortalAuthStatus.NotMember,
      });
    },
  );

  it("stays closed when the database lookup fails", async () => {
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockRejectedValue(new Error("connection refused"));

    await expect(authenticatePortalRequest(CUSTOMER_ID)).resolves.toEqual({
      status: PortalAuthStatus.Unavailable,
    });
  });

  it("never logs identity data when the lookup fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockRejectedValue(new Error("owner@example.test leaked"));

    await authenticatePortalRequest(CUSTOMER_ID);

    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "owner@example.test",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "user_member",
    );
  });
});
