import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { RoleSummaryDto } from "@invessiv/common/contracts/auth/role-summary.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { workspaceMemberRoles } from "@invessiv/db/record-configuration";
import { replaceWorkspaceMemberRoles } from "@/server/workspace/access/command-handler/replace-workspace-member-roles.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  findById: vi.fn(),
  checkAssignable: vi.fn(),
  bump: vi.fn(),
  createEvent: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
  hasActiveScopedRole: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock(
  "@/server/workspace/access/services/workspace-member-read-service",
  () => ({ workspaceMemberReadService: { findById: mocks.findById } }),
);
vi.mock("@/server/workspace/access/services/role-assignment-service", () => ({
  roleAssignmentService: { checkAssignable: mocks.checkAssignable },
}));
vi.mock(
  "@/server/workspace/access/services/member-active-access-service",
  () => ({
    memberActiveAccessService: {
      hasActiveScopedRole: mocks.hasActiveScopedRole,
    },
  }),
);
vi.mock(
  "@/server/workspace/access/services/workspace-member-version-service",
  () => ({ workspaceMemberVersionService: { bump: mocks.bump } }),
);
vi.mock("@/server/workspace/auth/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.createEvent },
}));

const MEMBER_ID = "3f0e8d4c-6a1b-4f55-9d7e-1c2b3a4d5e6f";
const ROLE_A = "1a1a1a1a-1a1a-4a1a-8a1a-1a1a1a1a1a1a";
const ROLE_B = "2b2b2b2b-2b2b-4b2b-8b2b-2b2b2b2b2b2b";
const ROLE_C = "3c3c3c3c-3c3c-4c3c-8c3c-3c3c3c3c3c3c";
const actor = workspaceActorWith();

function summary(id: string): RoleSummaryDto {
  return { id, name: id, systemKey: null, active: true };
}

const MEMBER: WorkspaceMemberDto = {
  id: MEMBER_ID,
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  roles: [summary(ROLE_A), summary(ROLE_B)],
  version: 2,
  createdAt: "2026-09-13T10:00:00.000Z",
};

describe("replaceWorkspaceMemberRoles", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    const tx = {
      insert: (table: unknown) => ({
        values: (values: unknown) => mocks.insert(table, values),
      }),
      delete: (table: unknown) => ({ where: () => mocks.delete(table) }),
    };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (value: unknown) => Promise<unknown>) =>
        callback(tx),
    });
    mocks.findById.mockResolvedValue(MEMBER);
    mocks.checkAssignable.mockResolvedValue({ ok: true });
    mocks.bump.mockResolvedValue({ ok: true });
    mocks.hasActiveScopedRole.mockResolvedValue(false);
  });

  it("answers a malformed id with not found without opening a transaction", async () => {
    expect(
      await replaceWorkspaceMemberRoles(
        "not-a-uuid",
        { roleIds: [ROLE_A], version: 2 },
        actor,
      ),
    ).toEqual({ ok: false, code: WorkspaceMemberErrorCode.MemberNotFound });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("passes the owner role rejection through before any write", async () => {
    mocks.checkAssignable.mockResolvedValue({
      ok: false,
      code: WorkspaceMemberErrorCode.OwnerRoleNotAssignable,
    });

    const result = await replaceWorkspaceMemberRoles(
      MEMBER_ID,
      { roleIds: [ROLE_C], version: 2 },
      actor,
    );

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.OwnerRoleNotAssignable,
    });
    expect(mocks.checkAssignable).toHaveBeenCalledWith(expect.anything(), {
      roleIds: [ROLE_C],
      currentRoleIds: [ROLE_A, ROLE_B],
    });
    expect(mocks.bump).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("refuses to leave a member without the owner role and without any role", async () => {
    expect(
      await replaceWorkspaceMemberRoles(
        MEMBER_ID,
        { roleIds: [], version: 2 },
        actor,
      ),
    ).toEqual({ ok: false, code: WorkspaceMemberErrorCode.MemberWithoutRole });
    expect(mocks.bump).not.toHaveBeenCalled();
  });

  it("lets a member drop every role while an active scoped role remains", async () => {
    mocks.hasActiveScopedRole.mockResolvedValue(true);

    const result = await replaceWorkspaceMemberRoles(
      MEMBER_ID,
      { roleIds: [], version: 2 },
      actor,
    );

    expect(result.ok).toBe(true);
    expect(mocks.hasActiveScopedRole).toHaveBeenCalledWith(
      expect.anything(),
      MEMBER_ID,
    );
  });

  it("lets an owner drop every other role because the owner role remains", async () => {
    mocks.findById.mockResolvedValue({ ...MEMBER, isOwner: true });

    const result = await replaceWorkspaceMemberRoles(
      MEMBER_ID,
      { roleIds: [], version: 2 },
      actor,
    );

    expect(result.ok).toBe(true);
    expect(mocks.delete).toHaveBeenCalledWith(workspaceMemberRoles);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.createEvent.mock.calls[0][1]).toMatchObject({
      metadata: { addedRoleIds: [], removedRoleIds: [ROLE_A, ROLE_B] },
    });
  });

  it("treats the same role set in another order as no change", async () => {
    const result = await replaceWorkspaceMemberRoles(
      MEMBER_ID,
      { roleIds: [ROLE_B, ROLE_A], version: 2 },
      actor,
    );

    expect(result).toEqual({ ok: true, member: MEMBER });
    expect(mocks.bump).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("bumps first, then removes and adds the difference and records one event", async () => {
    const calls: string[] = [];
    const replaced = {
      ...MEMBER,
      roles: [summary(ROLE_B), summary(ROLE_C)],
      version: 3,
    };
    mocks.findById
      .mockResolvedValueOnce(MEMBER)
      .mockResolvedValueOnce(replaced);
    mocks.bump.mockImplementation(async () => {
      calls.push("bump");
      return { ok: true };
    });
    mocks.delete.mockImplementation(async () => {
      calls.push("delete");
    });
    mocks.insert.mockImplementation(async () => {
      calls.push("insert");
    });
    mocks.createEvent.mockImplementation(async () => {
      calls.push("event");
    });

    const result = await replaceWorkspaceMemberRoles(
      MEMBER_ID,
      { roleIds: [ROLE_B, ROLE_C], version: 2 },
      actor,
    );

    expect(calls).toEqual(["bump", "delete", "insert", "event"]);
    expect(mocks.bump).toHaveBeenCalledWith(expect.anything(), MEMBER_ID, 2);
    expect(mocks.insert).toHaveBeenCalledWith(workspaceMemberRoles, [
      expect.objectContaining({
        workspace_member_id: MEMBER_ID,
        role_id: ROLE_C,
        role_realm: AuthRealm.Workspace,
        assigned_by_user_id: actor.userId,
      }),
    ]);
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    expect(mocks.createEvent.mock.calls[0][1]).toMatchObject({
      type: SecurityEventType.WorkspaceMemberRolesChanged,
      actor: { userId: actor.userId },
      subjectId: MEMBER_ID,
      metadata: { addedRoleIds: [ROLE_C], removedRoleIds: [ROLE_A] },
    });
    expect(result).toEqual({ ok: true, member: replaced });
  });

  it("passes a version conflict through without touching the assignments", async () => {
    const conflict = {
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 3,
        current: { ...MEMBER, version: 3 },
      },
    };
    mocks.bump.mockResolvedValue(conflict);

    expect(
      await replaceWorkspaceMemberRoles(
        MEMBER_ID,
        { roleIds: [ROLE_C], version: 2 },
        actor,
      ),
    ).toEqual(conflict);
    expect(mocks.delete).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });
});
