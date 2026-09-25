import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { revokeWorkspaceOwner } from "@/server/workspace/access/command-handler/revoke-workspace-owner.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  lockOwners: vi.fn(),
  findById: vi.fn(),
  bump: vi.fn(),
  createEvent: vi.fn(),
  deleteWhere: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock(
  "@/server/workspace/auth/services/workspace-owner-invariant-service",
  () => ({
    workspaceOwnerInvariantService: {
      ownerRoleId: "7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01",
      lockOwnerAssignmentsAndFindActiveOwners: mocks.lockOwners,
    },
  }),
);
vi.mock(
  "@/server/workspace/access/services/workspace-member-read-service",
  () => ({ workspaceMemberReadService: { findById: mocks.findById } }),
);
vi.mock(
  "@/server/workspace/access/services/workspace-member-version-service",
  () => ({ workspaceMemberVersionService: { bump: mocks.bump } }),
);
vi.mock("@/server/shared/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.createEvent },
}));

const MEMBER_ID = "3f0e8d4c-6a1b-4f55-9d7e-1c2b3a4d5e6f";

const OWNER: WorkspaceMemberDto = {
  id: MEMBER_ID,
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: true,
  hasActiveRole: true,
  accessScopeCount: 0,
  roles: [{ id: "role-member", name: "Member", systemKey: null, active: true }],
  version: 3,
  createdAt: "2026-09-13T10:00:00.000Z",
};

const actor = workspaceActorWith();

describe("revokeWorkspaceOwner", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    const tx = { delete: () => ({ where: mocks.deleteWhere }) };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (value: unknown) => Promise<unknown>) =>
        callback(tx),
    });
  });

  it("refuses to revoke the last active owner before writing anything", async () => {
    mocks.lockOwners.mockResolvedValue([MEMBER_ID]);
    mocks.findById.mockResolvedValue(OWNER);

    const result = await revokeWorkspaceOwner(MEMBER_ID, { version: 3 }, actor);

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.LastActiveOwner,
    });
    expect(mocks.bump).not.toHaveBeenCalled();
    expect(mocks.deleteWhere).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("lets another owner revoke an inactive owner, who never counted as an active owner", async () => {
    mocks.lockOwners.mockResolvedValue(["other-active-owner"]);
    mocks.findById
      .mockResolvedValueOnce({ ...OWNER, active: false })
      .mockResolvedValueOnce({
        ...OWNER,
        active: false,
        isOwner: false,
        hasActiveRole: true,
        accessScopeCount: 0,
        version: 4,
      });
    mocks.bump.mockResolvedValue({ ok: true });

    const result = await revokeWorkspaceOwner(MEMBER_ID, { version: 3 }, actor);

    expect(result.ok).toBe(true);
    expect(mocks.deleteWhere).toHaveBeenCalledTimes(1);
  });

  it("refuses to leave a member without any role", async () => {
    mocks.lockOwners.mockResolvedValue([MEMBER_ID, "other-owner"]);
    mocks.findById.mockResolvedValue({ ...OWNER, roles: [] });

    const result = await revokeWorkspaceOwner(MEMBER_ID, { version: 3 }, actor);

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberWithoutRole,
    });
    expect(mocks.bump).not.toHaveBeenCalled();
  });

  it("locks the owner set first, then bumps, deletes and records one event", async () => {
    const calls: string[] = [];
    mocks.lockOwners.mockImplementation(async () => {
      calls.push("lock");
      return [MEMBER_ID, "other-owner"];
    });
    mocks.findById
      .mockResolvedValueOnce(OWNER)
      .mockResolvedValueOnce({ ...OWNER, isOwner: false, version: 4 });
    mocks.bump.mockImplementation(async () => {
      calls.push("bump");
      return { ok: true };
    });
    mocks.deleteWhere.mockImplementation(async () => {
      calls.push("delete");
    });
    mocks.createEvent.mockImplementation(async () => {
      calls.push("event");
    });

    const result = await revokeWorkspaceOwner(MEMBER_ID, { version: 3 }, actor);

    expect(result).toEqual({
      ok: true,
      member: { ...OWNER, isOwner: false, version: 4 },
    });
    expect(calls).toEqual(["lock", "bump", "delete", "event"]);
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    expect(mocks.createEvent.mock.calls[0][1]).toMatchObject({
      type: SecurityEventType.WorkspaceOwnerRevoked,
      actor: { userId: actor.userId },
      subjectId: MEMBER_ID,
    });
  });

  it("refuses to revoke the actor's own owner role even when other owners exist", async () => {
    const result = await revokeWorkspaceOwner(
      MEMBER_ID,
      { version: 3 },
      { ...actor, workspaceMemberId: MEMBER_ID },
    );

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.SelfOwnerRevocation,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
    expect(mocks.lockOwners).not.toHaveBeenCalled();
  });

  it("answers an unknown id with not found without opening a transaction", async () => {
    const result = await revokeWorkspaceOwner(
      "not-a-uuid",
      { version: 1 },
      actor,
    );

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberNotFound,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });
});
