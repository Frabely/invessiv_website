import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { replaceAccessScopes } from "@/server/workspace/access/command-handler/replace-access-scopes.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock(
  "@/server/workspace/access/services/member-role-assignment-service",
  () => ({ memberRoleAssignmentService: { replace: mocks.replace } }),
);

const MEMBER_ID = "3f0e8d4c-6a1b-4f55-9d7e-1c2b3a4d5e6f";
const ROLE_ID = "1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a";
const CUSTOMER_ID = "4d4d4d4d-4d4d-4d4d-8d4d-4d4d4d4d4d4d";

describe("replaceAccessScopes", () => {
  beforeEach(() => mocks.replace.mockReset());

  it("delegates the complete scoped draft while preserving workspace-wide roles", async () => {
    const assignments = [
      {
        roleId: ROLE_ID,
        scope: { type: AccessScopeType.Customer, customerId: CUSTOMER_ID },
      },
    ];
    const result = { ok: true as const, member: { id: MEMBER_ID } };
    mocks.replace.mockResolvedValue(result);
    await expect(
      replaceAccessScopes(
        MEMBER_ID,
        { assignments, version: 2 },
        workspaceActorWith(),
      ),
    ).resolves.toEqual(result);
    expect(mocks.replace).toHaveBeenCalledWith(
      MEMBER_ID,
      { accessScopeAssignments: assignments, version: 2 },
      expect.anything(),
    );
  });

  it("rejects malformed input before invoking the service", async () => {
    await expect(
      replaceAccessScopes(
        "invalid",
        { assignments: [], version: 1 },
        workspaceActorWith(),
      ),
    ).resolves.toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberNotFound,
    });
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
