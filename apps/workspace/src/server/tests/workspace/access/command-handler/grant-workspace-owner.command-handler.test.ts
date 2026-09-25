import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { workspaceMemberRoles } from "@invessiv/db/record-configuration";
import { grantWorkspaceOwner } from "@/server/workspace/access/command-handler/grant-workspace-owner.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const OWNER_ROLE_ID = "7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a01";

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  findById: vi.fn(),
  bump: vi.fn(),
  createEvent: vi.fn(),
  insert: vi.fn(),
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
const actor = workspaceActorWith();

const MEMBER: WorkspaceMemberDto = {
  id: MEMBER_ID,
  userId: "user-1",
  displayName: "Anna Beispiel",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  roles: [{ id: "role-member", name: "Member", systemKey: null, active: true }],
  version: 3,
  createdAt: "2026-09-13T10:00:00.000Z",
};

describe("grantWorkspaceOwner", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    const tx = {
      insert: (table: unknown) => ({
        values: (values: unknown) => mocks.insert(table, values),
      }),
    };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (value: unknown) => Promise<unknown>) =>
        callback(tx),
    });
  });

  it("answers a malformed id with not found without opening a transaction", async () => {
    expect(
      await grantWorkspaceOwner("not-a-uuid", { version: 3 }, actor),
    ).toEqual({ ok: false, code: WorkspaceMemberErrorCode.MemberNotFound });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("rejects a body without a positive version", async () => {
    expect(
      await grantWorkspaceOwner(MEMBER_ID, { version: 0 }, actor),
    ).toMatchObject({
      ok: false,
      code: WorkspaceMemberErrorCode.ValidationError,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("answers a missing member with not found", async () => {
    mocks.findById.mockResolvedValue(null);

    expect(await grantWorkspaceOwner(MEMBER_ID, { version: 3 }, actor)).toEqual(
      {
        ok: false,
        code: WorkspaceMemberErrorCode.MemberNotFound,
      },
    );
    expect(mocks.bump).not.toHaveBeenCalled();
  });

  it("refuses a member who already is owner before bumping the version", async () => {
    mocks.findById.mockResolvedValue({ ...MEMBER, isOwner: true });

    expect(await grantWorkspaceOwner(MEMBER_ID, { version: 3 }, actor)).toEqual(
      {
        ok: false,
        code: WorkspaceMemberErrorCode.AlreadyOwner,
      },
    );
    expect(mocks.bump).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("refuses a deactivated member before bumping the version", async () => {
    mocks.findById.mockResolvedValue({ ...MEMBER, active: false });

    expect(await grantWorkspaceOwner(MEMBER_ID, { version: 3 }, actor)).toEqual(
      {
        ok: false,
        code: WorkspaceMemberErrorCode.MemberInactive,
      },
    );
    expect(mocks.bump).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("passes a version conflict through without assigning the owner role", async () => {
    const conflict = {
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 4,
        current: { ...MEMBER, version: 4 },
      },
    };
    mocks.findById.mockResolvedValue(MEMBER);
    mocks.bump.mockResolvedValue(conflict);

    expect(await grantWorkspaceOwner(MEMBER_ID, { version: 3 }, actor)).toEqual(
      conflict,
    );
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("bumps the version, assigns the owner role and records one event", async () => {
    const calls: string[] = [];
    const granted = { ...MEMBER, isOwner: true, version: 4 };
    mocks.findById.mockResolvedValueOnce(MEMBER).mockResolvedValueOnce(granted);
    mocks.bump.mockImplementation(async () => {
      calls.push("bump");
      return { ok: true };
    });
    mocks.insert.mockImplementation(async () => {
      calls.push("insert");
    });
    mocks.createEvent.mockImplementation(async () => {
      calls.push("event");
    });

    const result = await grantWorkspaceOwner(MEMBER_ID, { version: 3 }, actor);

    expect(calls).toEqual(["bump", "insert", "event"]);
    expect(mocks.bump).toHaveBeenCalledWith(expect.anything(), MEMBER_ID, 3);
    expect(mocks.insert).toHaveBeenCalledWith(
      workspaceMemberRoles,
      expect.objectContaining({
        workspace_member_id: MEMBER_ID,
        role_id: OWNER_ROLE_ID,
        role_realm: AuthRealm.Workspace,
        assigned_by_user_id: actor.userId,
      }),
    );
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    expect(mocks.createEvent.mock.calls[0][1]).toMatchObject({
      type: SecurityEventType.WorkspaceOwnerGranted,
      actor: { userId: actor.userId },
      subjectType: SecuritySubjectType.WorkspaceMember,
      subjectId: MEMBER_ID,
    });
    expect(result).toEqual({ ok: true, member: granted });
  });
});
