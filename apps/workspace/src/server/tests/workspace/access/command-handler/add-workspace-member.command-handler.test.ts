import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { PostgresErrorCode } from "@invessiv/db/core";
import { addWorkspaceMember } from "@/server/workspace/access/command-handler/add-workspace-member.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  findProfile: vi.fn(),
  checkAssignable: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/access/services/clerk-directory-service", () => ({
  clerkDirectoryService: { findProfile: mocks.findProfile },
}));
vi.mock("@/server/workspace/access/services/role-assignment-service", () => ({
  roleAssignmentService: { checkAssignable: mocks.checkAssignable },
}));

const ROLE_ID = "5b7b1c2e-8d3f-4a6b-9c0d-1e2f3a4b5c6d";
const actor = workspaceActorWith();
const input = { clerkUserId: "user_anna", roleIds: [ROLE_ID] };

function failTransactionWith(violation: { code: string; constraint: string }) {
  mocks.getDatabase.mockReturnValue({
    transaction: () =>
      Promise.reject(new Error("insert failed", { cause: violation })),
  });
}

describe("addWorkspaceMember", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.findProfile.mockResolvedValue({
      ok: true,
      profile: {
        clerkUserId: "user_anna",
        primaryEmail: "anna@example.test",
        firstName: "Anna",
        lastName: null,
        displayName: "Anna",
      },
    });
    mocks.checkAssignable.mockResolvedValue({ ok: true });
  });

  it("rejects an empty role list before asking Clerk", async () => {
    const result = await addWorkspaceMember({ ...input, roleIds: [] }, actor);

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberWithoutRole,
    });
    expect(mocks.findProfile).not.toHaveBeenCalled();
  });

  it("passes a Clerk outage through as its own code", async () => {
    mocks.findProfile.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkUnavailable,
    });

    expect(await addWorkspaceMember(input, actor)).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.ClerkUnavailable,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it.each([
    [
      PostgresErrorCode.UniqueViolation,
      "users_clerk_user_id_uidx",
      WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked,
    ],
    [
      PostgresErrorCode.ForeignKeyViolation,
      "workspace_member_roles_role_fkey",
      WorkspaceMemberErrorCode.RoleNotAssignable,
    ],
    [
      PostgresErrorCode.CheckViolation,
      "users_primary_email_check",
      WorkspaceMemberErrorCode.ClerkAccountIncomplete,
    ],
  ])("maps %s on %s to %s", async (code, constraint, expected) => {
    failTransactionWith({ code, constraint });

    expect(await addWorkspaceMember(input, actor)).toEqual({
      ok: false,
      code: expected,
    });
  });

  it("rethrows unknown database failures so the route logs them", async () => {
    failTransactionWith({
      code: PostgresErrorCode.ForeignKeyViolation,
      constraint: "workspace_member_roles_assigned_by_user_id_fkey",
    });

    await expect(addWorkspaceMember(input, actor)).rejects.toThrow(
      "insert failed",
    );
  });
});
