import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { BootstrapWorkspaceOwnerError } from "@/common/constants/auth/bootstrap-workspace-owner-errors";
import { WorkspaceActorResolutionError } from "@/common/constants/auth/workspace-actor-resolution-errors";
import { WorkspaceAuthStatus } from "@/common/constants/auth/workspace-auth-statuses";
import { authenticateWorkspaceRequest } from "./workspace-authentication";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockResolve, mockBootstrap } = vi.hoisted(
  () => ({
    mockAuth: vi.fn(),
    mockCurrentUser: vi.fn(),
    mockResolve: vi.fn(),
    mockBootstrap: vi.fn(),
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));
vi.mock(
  "@/server/workspace/auth/query-handler/resolve-workspace-actor.query-handler",
  () => ({ resolveWorkspaceActor: mockResolve }),
);
vi.mock(
  "@/server/workspace/auth/command-handler/bootstrap-workspace-owner.command-handler",
  () => ({ bootstrapWorkspaceOwner: mockBootstrap }),
);

const BOOTSTRAP_CLERK_ID = "user_owner";
const ACTOR = {
  userId: "user-uuid-1",
  workspaceMemberId: "member-uuid-1",
  permissions: new Set([Permission.DashboardRead]),
};

function clerkProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOTSTRAP_CLERK_ID,
    firstName: "Moritz",
    lastName: "Hecht",
    primaryEmailAddressId: "email_primary",
    emailAddresses: [
      { id: "email_other", emailAddress: "other@example.test" },
      { id: "email_primary", emailAddress: "owner@example.test" },
    ],
    ...overrides,
  };
}

describe("authenticateWorkspaceRequest", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("WORKSPACE_BOOTSTRAP_CLERK_USER_ID", BOOTSTRAP_CLERK_ID);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockResolve.mockReset();
    mockBootstrap.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("is unauthenticated without a Clerk session and never touches the database", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.Unauthenticated,
    });
    expect(mockResolve).not.toHaveBeenCalled();
  });

  it("authorizes a resolved actor", async () => {
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockResolvedValue({ ok: true, actor: ACTOR });

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.Authorized,
      actor: ACTOR,
    });
    expect(mockResolve).toHaveBeenCalledWith("user_member");
  });

  it.each([
    WorkspaceActorResolutionError.UserInactive,
    WorkspaceActorResolutionError.MembershipInactive,
  ])(
    "reports inactive access for %s without attempting a bootstrap",
    async (code) => {
      mockAuth.mockResolvedValue({ userId: BOOTSTRAP_CLERK_ID });
      mockResolve.mockResolvedValue({ ok: false, code });

      await expect(authenticateWorkspaceRequest()).resolves.toEqual({
        status: WorkspaceAuthStatus.Inactive,
      });
      expect(mockBootstrap).not.toHaveBeenCalled();
    },
  );

  it("keeps a missing membership in the pending approval state", async () => {
    mockAuth.mockResolvedValue({ userId: BOOTSTRAP_CLERK_ID });
    mockResolve.mockResolvedValue({
      ok: false,
      code: WorkspaceActorResolutionError.MembershipMissing,
    });

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.NotMember,
    });
    expect(mockBootstrap).not.toHaveBeenCalled();
  });

  it("denies an unknown account that is not the bootstrap identity", async () => {
    mockAuth.mockResolvedValue({ userId: "user_intruder" });
    mockResolve.mockResolvedValue({
      ok: false,
      code: WorkspaceActorResolutionError.UserMissing,
    });

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.NotMember,
    });
    expect(mockCurrentUser).not.toHaveBeenCalled();
    expect(mockBootstrap).not.toHaveBeenCalled();
  });

  it("bootstraps the configured identity with its Clerk master data and resolves again", async () => {
    mockAuth.mockResolvedValue({ userId: BOOTSTRAP_CLERK_ID });
    mockResolve
      .mockResolvedValueOnce({
        ok: false,
        code: WorkspaceActorResolutionError.UserMissing,
      })
      .mockResolvedValueOnce({ ok: true, actor: ACTOR });
    mockCurrentUser.mockResolvedValue(clerkProfile());
    mockBootstrap.mockResolvedValue({
      ok: true,
      userId: ACTOR.userId,
      workspaceMemberId: ACTOR.workspaceMemberId,
    });

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.Authorized,
      actor: ACTOR,
    });
    expect(mockBootstrap).toHaveBeenCalledWith({
      clerkUserId: BOOTSTRAP_CLERK_ID,
      primaryEmail: "owner@example.test",
      firstName: "Moritz",
      lastName: "Hecht",
      displayName: "Moritz Hecht",
    });
    expect(mockResolve).toHaveBeenCalledTimes(2);
  });

  it("falls back to the email as display name when Clerk has no name", async () => {
    mockAuth.mockResolvedValue({ userId: BOOTSTRAP_CLERK_ID });
    mockResolve
      .mockResolvedValueOnce({
        ok: false,
        code: WorkspaceActorResolutionError.UserMissing,
      })
      .mockResolvedValueOnce({ ok: true, actor: ACTOR });
    mockCurrentUser.mockResolvedValue(
      clerkProfile({ firstName: null, lastName: "  " }),
    );
    mockBootstrap.mockResolvedValue({ ok: true });

    await authenticateWorkspaceRequest();

    expect(mockBootstrap).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: "owner@example.test" }),
    );
  });

  it("does not bootstrap a Clerk account without a primary email", async () => {
    mockAuth.mockResolvedValue({ userId: BOOTSTRAP_CLERK_ID });
    mockResolve.mockResolvedValue({
      ok: false,
      code: WorkspaceActorResolutionError.UserMissing,
    });
    mockCurrentUser.mockResolvedValue(clerkProfile({ emailAddresses: [] }));

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.NotMember,
    });
    expect(mockBootstrap).not.toHaveBeenCalled();
  });

  it("authorizes when a concurrent request already bootstrapped the same identity", async () => {
    mockAuth.mockResolvedValue({ userId: BOOTSTRAP_CLERK_ID });
    mockResolve
      .mockResolvedValueOnce({
        ok: false,
        code: WorkspaceActorResolutionError.UserMissing,
      })
      .mockResolvedValueOnce({ ok: true, actor: ACTOR });
    mockCurrentUser.mockResolvedValue(clerkProfile());
    mockBootstrap.mockResolvedValue({
      ok: false,
      code: BootstrapWorkspaceOwnerError.AlreadyInitialized,
    });

    await expect(authenticateWorkspaceRequest()).resolves.toMatchObject({
      status: WorkspaceAuthStatus.Authorized,
    });
  });

  it("denies the bootstrap identity once another active owner exists", async () => {
    mockAuth.mockResolvedValue({ userId: BOOTSTRAP_CLERK_ID });
    mockResolve.mockResolvedValue({
      ok: false,
      code: WorkspaceActorResolutionError.UserMissing,
    });
    mockCurrentUser.mockResolvedValue(clerkProfile());
    mockBootstrap.mockResolvedValue({
      ok: false,
      code: BootstrapWorkspaceOwnerError.AlreadyInitialized,
    });

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.NotMember,
    });
  });

  it("preserves an inactive result after a concurrent bootstrap attempt", async () => {
    mockAuth.mockResolvedValue({ userId: BOOTSTRAP_CLERK_ID });
    mockResolve
      .mockResolvedValueOnce({
        ok: false,
        code: WorkspaceActorResolutionError.UserMissing,
      })
      .mockResolvedValueOnce({
        ok: false,
        code: WorkspaceActorResolutionError.MembershipInactive,
      });
    mockCurrentUser.mockResolvedValue(clerkProfile());
    mockBootstrap.mockResolvedValue({
      ok: false,
      code: BootstrapWorkspaceOwnerError.AlreadyInitialized,
    });

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.Inactive,
    });
  });

  it("stays closed when the database lookup fails", async () => {
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockRejectedValue(new Error("connection refused"));

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.Unavailable,
    });
  });

  it("stays closed when the bootstrap transaction fails", async () => {
    mockAuth.mockResolvedValue({ userId: BOOTSTRAP_CLERK_ID });
    mockResolve.mockResolvedValue({
      ok: false,
      code: WorkspaceActorResolutionError.UserMissing,
    });
    mockCurrentUser.mockResolvedValue(clerkProfile());
    mockBootstrap.mockRejectedValue(new Error("deadlock detected"));

    await expect(authenticateWorkspaceRequest()).resolves.toEqual({
      status: WorkspaceAuthStatus.Unavailable,
    });
  });

  it("never logs identity data when the lookup fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mockAuth.mockResolvedValue({ userId: "user_member" });
    mockResolve.mockRejectedValue(new Error("owner@example.test leaked"));

    await authenticateWorkspaceRequest();

    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "owner@example.test",
    );
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(
      "user_member",
    );
  });
});
