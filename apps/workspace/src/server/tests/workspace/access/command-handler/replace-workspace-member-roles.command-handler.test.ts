import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { replaceWorkspaceMemberRoles } from "@/server/workspace/access/command-handler/replace-workspace-member-roles.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock(
  "@/server/workspace/access/services/member-role-assignment-service",
  () => ({ memberRoleAssignmentService: { replace: mocks.replace } }),
);

const MEMBER_ID = "3f0e8d4c-6a1b-4f55-9d7e-1c2b3a4d5e6f";
const ROLE_ID = "1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a";

describe("replaceWorkspaceMemberRoles", () => {
  beforeEach(() => mocks.replace.mockReset());

  it("rejects an invalid member id before invoking the assignment service", async () => {
    await expect(
      replaceWorkspaceMemberRoles(
        "invalid",
        { roleIds: [], version: 1 },
        workspaceActorWith(),
      ),
    ).resolves.toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberNotFound,
    });
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("delegates a valid global-role replacement while preserving scoped roles", async () => {
    const result = { ok: true as const, member: { id: MEMBER_ID } };
    mocks.replace.mockResolvedValue(result);
    await expect(
      replaceWorkspaceMemberRoles(
        MEMBER_ID,
        { roleIds: [ROLE_ID], version: 2 },
        workspaceActorWith(),
      ),
    ).resolves.toEqual(result);
    expect(mocks.replace).toHaveBeenCalledWith(
      MEMBER_ID,
      { roleIds: [ROLE_ID], version: 2 },
      expect.anything(),
    );
  });
});
