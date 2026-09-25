import { describe, expect, it, vi } from "vitest";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { memberRoleAssignmentService } from "@/server/workspace/access/services/member-role-assignment-service";

vi.mock("server-only", () => ({}));

type RoleRow = {
  id: string;
  realm: AuthRealm;
  system_key: SystemRoleKey | null;
  active: boolean;
  scope_assignable: boolean | null;
};

const ROLE_A = "1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a";
const ROLE_B = "2b2b2b2b-2b2b-4b2b-8b2b-2b2b2b2b2b2b";

function row(id: string, overrides: Partial<RoleRow> = {}): RoleRow {
  return {
    id,
    realm: AuthRealm.Workspace,
    system_key: null,
    active: true,
    scope_assignable: false,
    ...overrides,
  };
}

function executorReturning(rows: RoleRow[]) {
  const forLock = vi.fn(() => Promise.resolve(rows));
  const select = vi.fn(() => ({
    from: () => ({ where: () => ({ for: forLock }) }),
  }));
  const executor = { select } as unknown as Parameters<
    typeof memberRoleAssignmentService.checkAssignable
  >[0];
  return { executor, forLock, select };
}

describe("memberRoleAssignmentService.checkAssignable", () => {
  it("accepts an empty selection without querying", async () => {
    const { executor, select } = executorReturning([]);

    expect(
      await memberRoleAssignmentService.checkAssignable(executor, {
        roleIds: [],
        currentRoleIds: [],
      }),
    ).toEqual({ ok: true });
    expect(select).not.toHaveBeenCalled();
  });

  it("accepts active workspace roles", async () => {
    const { executor, forLock } = executorReturning([row(ROLE_A), row(ROLE_B)]);

    expect(
      await memberRoleAssignmentService.checkAssignable(executor, {
        roleIds: [ROLE_A, ROLE_B],
        currentRoleIds: [],
      }),
    ).toEqual({ ok: true });
    expect(forLock).toHaveBeenCalledWith("update");
  });

  it("rejects a scope-assignable role that the member does not hold yet", async () => {
    const { executor } = executorReturning([
      row(ROLE_A, { scope_assignable: true }),
    ]);

    expect(
      await memberRoleAssignmentService.checkAssignable(executor, {
        roleIds: [ROLE_A],
        currentRoleIds: [],
      }),
    ).toEqual({ ok: false, code: WorkspaceMemberErrorCode.RoleNotAssignable });
  });

  it("keeps an already held scope-assignable role", async () => {
    const { executor } = executorReturning([
      row(ROLE_A, { scope_assignable: true }),
    ]);

    expect(
      await memberRoleAssignmentService.checkAssignable(executor, {
        roleIds: [ROLE_A],
        currentRoleIds: [ROLE_A],
      }),
    ).toEqual({ ok: true });
  });

  it("rejects the owner role with its own code", async () => {
    const { executor } = executorReturning([
      row(ROLE_A),
      row(ROLE_B, { system_key: SystemRoleKey.WorkspaceOwner }),
    ]);

    expect(
      await memberRoleAssignmentService.checkAssignable(executor, {
        roleIds: [ROLE_A, ROLE_B],
        currentRoleIds: [ROLE_B],
      }),
    ).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.OwnerRoleNotAssignable,
    });
  });

  it("rejects dropping the owner role by omitting it from roleIds", async () => {
    const { executor } = executorReturning([
      row(ROLE_A),
      row(ROLE_B, { system_key: SystemRoleKey.WorkspaceOwner }),
    ]);

    expect(
      await memberRoleAssignmentService.checkAssignable(executor, {
        roleIds: [ROLE_A],
        currentRoleIds: [ROLE_A, ROLE_B],
      }),
    ).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.OwnerRoleNotAssignable,
    });
  });

  it("rejects wiping every role when the owner role is currently held", async () => {
    const { executor } = executorReturning([
      row(ROLE_B, { system_key: SystemRoleKey.WorkspaceOwner }),
    ]);

    expect(
      await memberRoleAssignmentService.checkAssignable(executor, {
        roleIds: [],
        currentRoleIds: [ROLE_B],
      }),
    ).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.OwnerRoleNotAssignable,
    });
  });

  it.each([
    ["an unknown role id", [row(ROLE_A)], []],
    [
      "a portal role",
      [row(ROLE_A), row(ROLE_B, { realm: AuthRealm.Portal })],
      [],
    ],
    [
      "an inactive role the member does not hold yet",
      [row(ROLE_A), row(ROLE_B, { active: false })],
      [ROLE_A],
    ],
  ])("rejects %s", async (_case, rows, currentRoleIds) => {
    const { executor } = executorReturning(rows);

    expect(
      await memberRoleAssignmentService.checkAssignable(executor, {
        roleIds: [ROLE_A, ROLE_B],
        currentRoleIds,
      }),
    ).toEqual({ ok: false, code: WorkspaceMemberErrorCode.RoleNotAssignable });
  });

  it("keeps an inactive role the member already holds", async () => {
    const { executor } = executorReturning([
      row(ROLE_A),
      row(ROLE_B, { active: false }),
    ]);

    expect(
      await memberRoleAssignmentService.checkAssignable(executor, {
        roleIds: [ROLE_A, ROLE_B],
        currentRoleIds: [ROLE_B],
      }),
    ).toEqual({ ok: true });
  });
});
