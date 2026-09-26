import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalActorResolutionError } from "@/common/constants/auth/portal-actor-resolution-errors";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "./portal-actor";
import { createPortalOwnerView } from "./portal-owner-view";
import { portalAuthenticationService } from "./portal-authentication-service";

vi.mock("server-only", () => ({}));

const { mockAuth, mockResolve, mockResolveOwnerView } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockResolve: vi.fn(),
  mockResolveOwnerView: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mockAuth }));
vi.mock(
  "@/server/portal/query-handler/resolve-portal-actor.query-handler",
  () => ({ resolvePortalActor: mockResolve }),
);
vi.mock("./resolve-portal-owner-view", () => ({
  resolvePortalOwnerView: mockResolveOwnerView,
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

describe("portalAuthenticationService.authenticateRequest", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockResolve.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("is unauthenticated without a Clerk session", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(
      portalAuthenticationService.authenticateRequest(CUSTOMER_ID),
    ).resolves.toEqual({
      status: PortalAuthStatus.Unauthenticated,
    });
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it("is not_member for a malformed customer id, without querying the database", async () => {
    mockAuth.mockResolvedValue({ userId: "user_member" });

    await expect(
      portalAuthenticationService.authenticateRequest("not-a-uuid"),
    ).resolves.toEqual({
      status: PortalAuthStatus.NotMember,
    });
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it("authorizes a resolved actor", async () => {
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockResolvedValue({ ok: true, actor: ACTOR });

    await expect(
      portalAuthenticationService.authenticateRequest(CUSTOMER_ID),
    ).resolves.toEqual({
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

      await expect(
        portalAuthenticationService.authenticateRequest(CUSTOMER_ID),
      ).resolves.toEqual({
        status: PortalAuthStatus.NotMember,
      });
    },
  );

  it("stays closed when the database lookup fails", async () => {
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockRejectedValue(new Error("connection refused"));

    await expect(
      portalAuthenticationService.authenticateRequest(CUSTOMER_ID),
    ).resolves.toEqual({
      status: PortalAuthStatus.Unavailable,
    });
  });

  it("never logs identity data when the lookup fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockRejectedValue(new Error("owner@example.test leaked"));

    await portalAuthenticationService.authenticateRequest(CUSTOMER_ID);

    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "owner@example.test",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "user_member",
    );
  });
});

describe("portalAuthenticationService.authenticateReader", () => {
  const OWNER_VIEW = createPortalOwnerView({
    userId: "owner-user-uuid",
    customerId: CUSTOMER_ID,
    permissions: new Set([Permission.PortalAccess]),
  });

  beforeEach(() => {
    mockAuth.mockReset();
    mockResolve.mockReset();
    mockResolveOwnerView.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("is unauthenticated without a Clerk session", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(
      portalAuthenticationService.authenticateReader(CUSTOMER_ID),
    ).resolves.toEqual({
      status: PortalAuthStatus.Unauthenticated,
    });
    expect(mockResolve).not.toHaveBeenCalled();
    expect(mockResolveOwnerView).not.toHaveBeenCalled();
  });

  it("rejects a malformed customer id before any owner lookup", async () => {
    mockAuth.mockResolvedValue({ userId: "user_owner" });

    await expect(
      portalAuthenticationService.authenticateReader("not-a-uuid"),
    ).resolves.toEqual({
      status: PortalAuthStatus.NotMember,
    });
    expect(mockResolveOwnerView).not.toHaveBeenCalled();
  });

  it("prefers a real membership, even for an owner", async () => {
    mockAuth.mockResolvedValue({ userId: "user_owner" });
    mockResolve.mockResolvedValue({ ok: true, actor: ACTOR });

    await expect(
      portalAuthenticationService.authenticateReader(CUSTOMER_ID),
    ).resolves.toEqual({
      status: PortalAuthStatus.Authorized,
      reader: ACTOR,
    });
    expect(mockResolveOwnerView).not.toHaveBeenCalled();
  });

  it("falls back to the owner view without a membership", async () => {
    mockAuth.mockResolvedValue({ userId: "user_owner" });
    mockResolve.mockResolvedValue({
      ok: false,
      code: PortalActorResolutionError.MembershipMissing,
    });
    mockResolveOwnerView.mockResolvedValue(OWNER_VIEW);

    await expect(
      portalAuthenticationService.authenticateReader(CUSTOMER_ID),
    ).resolves.toEqual({
      status: PortalAuthStatus.Authorized,
      reader: OWNER_VIEW,
    });
    expect(mockResolveOwnerView).toHaveBeenCalledWith(
      "user_owner",
      CUSTOMER_ID,
    );
  });

  it("is not_member for a non-owner without a membership", async () => {
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockResolvedValue({
      ok: false,
      code: PortalActorResolutionError.UserMissing,
    });
    mockResolveOwnerView.mockResolvedValue(null);

    await expect(
      portalAuthenticationService.authenticateReader(CUSTOMER_ID),
    ).resolves.toEqual({
      status: PortalAuthStatus.NotMember,
    });
  });

  it("stays closed when the owner lookup fails", async () => {
    mockAuth.mockResolvedValue({ userId: "user_owner" });
    mockResolve.mockResolvedValue({
      ok: false,
      code: PortalActorResolutionError.MembershipMissing,
    });
    mockResolveOwnerView.mockRejectedValue(new Error("db down"));

    await expect(
      portalAuthenticationService.authenticateReader(CUSTOMER_ID),
    ).resolves.toEqual({
      status: PortalAuthStatus.Unavailable,
    });
  });
});
