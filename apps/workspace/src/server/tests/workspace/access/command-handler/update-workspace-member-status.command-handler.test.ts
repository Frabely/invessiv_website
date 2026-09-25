import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { OwnableEntity } from "@invessiv/common/constants/crm/ownable-entities";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { updateWorkspaceMemberStatus } from "@/server/workspace/access/command-handler/update-workspace-member-status.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  lockOwners: vi.fn(),
  lockMember: vi.fn(),
  findById: vi.fn(),
  countResponsibilities: vi.fn(),
  updateStatus: vi.fn(),
  createEvent: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock(
  "@/server/workspace/auth/services/workspace-owner-invariant-service",
  () => ({
    workspaceOwnerInvariantService: {
      lockOwnerAssignmentsAndFindActiveOwners: mocks.lockOwners,
    },
  }),
);
vi.mock(
  "@/server/workspace/access/services/responsibilities/member-responsibility-lock-service",
  () => ({
    memberResponsibilityLockService: {
      lockMemberForDeactivation: mocks.lockMember,
    },
  }),
);
vi.mock(
  "@/server/workspace/access/services/workspace-member-read-service",
  () => ({ workspaceMemberReadService: { findById: mocks.findById } }),
);
vi.mock(
  "@/server/workspace/access/services/workspace-member-version-service",
  () => ({
    workspaceMemberVersionService: { updateStatus: mocks.updateStatus },
  }),
);
vi.mock(
  "@/server/workspace/access/services/responsibilities/responsibility-counter-registry",
  () => ({
    responsibilityCounterService: {
      countOpenByMemberId: mocks.countResponsibilities,
    },
  }),
);
vi.mock("@/server/shared/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.createEvent },
}));

const MEMBER_ID = "3f0e8d4c-6a1b-4f55-9d7e-1c2b3a4d5e6f";
const MEMBER: WorkspaceMemberDto = {
  id: MEMBER_ID,
  userId: "user-2",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  roles: [],
  version: 3,
  createdAt: "2026-09-13T10:00:00.000Z",
};
const actor = {
  ...workspaceActorWith(),
  workspaceMemberId: "actor-member",
};

describe("updateWorkspaceMemberStatus", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (tx: object) => Promise<unknown>) => callback({}),
    });
    mocks.lockOwners.mockResolvedValue(["another-owner"]);
    mocks.countResponsibilities.mockResolvedValue({
      [OwnableEntity.Customer]: 0,
      [OwnableEntity.Task]: 0,
    });
    mocks.updateStatus.mockResolvedValue({ ok: true });
  });

  it("rejects self-deactivation before opening a transaction", async () => {
    const result = await updateWorkspaceMemberStatus(
      MEMBER_ID,
      { active: false, version: 3 },
      { ...actor, workspaceMemberId: MEMBER_ID },
    );

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.SelfDeactivation,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("rejects the last active owner before counting or writing", async () => {
    mocks.lockOwners.mockResolvedValue([MEMBER_ID]);
    mocks.findById.mockResolvedValue({ ...MEMBER, isOwner: true });

    const result = await updateWorkspaceMemberStatus(
      MEMBER_ID,
      { active: false, version: 3 },
      actor,
    );

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.LastActiveOwner,
    });
    expect(mocks.countResponsibilities).not.toHaveBeenCalled();
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });

  it("returns exhaustive responsibility counts without a partial write", async () => {
    mocks.findById.mockResolvedValue(MEMBER);
    mocks.countResponsibilities.mockResolvedValue({
      [OwnableEntity.Customer]: 2,
      [OwnableEntity.Task]: 0,
    });

    const result = await updateWorkspaceMemberStatus(
      MEMBER_ID,
      { active: false, version: 3 },
      actor,
    );

    expect(result).toEqual({
      ok: false,
      code: WorkspaceMemberErrorCode.MemberHasOpenResponsibilities,
      responsibilityCounts: {
        [OwnableEntity.Customer]: 2,
        [OwnableEntity.Task]: 0,
      },
    });
    expect(mocks.updateStatus).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it.each([
    [true, WorkspaceMemberErrorCode.MemberAlreadyActive],
    [false, WorkspaceMemberErrorCode.MemberAlreadyInactive],
  ] as const)("rejects an unchanged %s state", async (active, code) => {
    mocks.findById.mockResolvedValue({ ...MEMBER, active });

    const result = await updateWorkspaceMemberStatus(
      MEMBER_ID,
      { active, version: 3 },
      actor,
    );

    expect(result).toEqual({ ok: false, code });
    expect(mocks.updateStatus).not.toHaveBeenCalled();
  });

  it("deactivates only after every guard and writes exactly one event", async () => {
    const calls: string[] = [];
    mocks.lockOwners.mockImplementation(async () => {
      calls.push("lock");
      return ["another-owner"];
    });
    mocks.findById
      .mockImplementationOnce(async () => {
        calls.push("read");
        return MEMBER;
      })
      .mockResolvedValueOnce({ ...MEMBER, active: false, version: 4 });
    mocks.lockMember.mockImplementation(async () => {
      calls.push("lock-member");
    });
    mocks.countResponsibilities.mockImplementation(async () => {
      calls.push("count");
      return {
        [OwnableEntity.Customer]: 0,
        [OwnableEntity.Task]: 0,
      };
    });
    mocks.updateStatus.mockImplementation(async () => {
      calls.push("write");
      return { ok: true };
    });
    mocks.createEvent.mockImplementation(async () => {
      calls.push("event");
    });

    const result = await updateWorkspaceMemberStatus(
      MEMBER_ID,
      { active: false, version: 3 },
      actor,
    );

    expect(result).toEqual({
      ok: true,
      member: { ...MEMBER, active: false, version: 4 },
    });
    expect(calls).toEqual([
      "lock",
      "read",
      "lock-member",
      "count",
      "write",
      "event",
    ]);
    expect(mocks.lockMember).toHaveBeenCalledWith({}, MEMBER_ID);
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    expect(mocks.createEvent.mock.calls[0][1]).toMatchObject({
      type: SecurityEventType.WorkspaceMemberDeactivated,
      subjectId: MEMBER_ID,
    });
  });

  it("reactivates without owner locking or responsibility counting", async () => {
    mocks.findById
      .mockResolvedValueOnce({ ...MEMBER, active: false })
      .mockResolvedValueOnce({ ...MEMBER, active: true, version: 4 });

    const result = await updateWorkspaceMemberStatus(
      MEMBER_ID,
      { active: true, version: 3 },
      actor,
    );

    expect(result.ok).toBe(true);
    expect(mocks.lockOwners).not.toHaveBeenCalled();
    expect(mocks.lockMember).not.toHaveBeenCalled();
    expect(mocks.countResponsibilities).not.toHaveBeenCalled();
    expect(mocks.createEvent.mock.calls[0][1]).toMatchObject({
      type: SecurityEventType.WorkspaceMemberActivated,
    });
  });
});
