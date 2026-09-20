import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { UsersConstraintName } from "@invessiv/db/constraint-names/auth/users-constraint-names";
import { WorkspaceMemberRolesConstraintName } from "@invessiv/db/constraint-names/auth/workspace-member-roles-constraint-names";
import { PostgresErrorCode } from "@invessiv/db/core";
import {
  users,
  workspaceMemberRoles,
  workspaceMembers,
} from "@invessiv/db/record-configuration";
import { addWorkspaceMember } from "@/server/workspace/access/command-handler/add-workspace-member.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  findProfile: vi.fn(),
  checkAssignable: vi.fn(),
  findById: vi.fn(),
  createEvent: vi.fn(),
  insert: vi.fn(),
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
vi.mock(
  "@/server/workspace/access/services/workspace-member-read-service",
  () => ({ workspaceMemberReadService: { findById: mocks.findById } }),
);
vi.mock("@/server/workspace/auth/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.createEvent },
}));

const ROLE_ID = "5b7b1c2e-8d3f-4a6b-9c0d-1e2f3a4b5c6d";
const actor = workspaceActorWith();
const input = { clerkUserId: "user_anna", roleIds: [ROLE_ID] };

const CREATED_MEMBER: WorkspaceMemberDto = {
  id: "member-new",
  userId: "user-new",
  displayName: "Anna",
  primaryEmail: "anna@example.test",
  active: true,
  isOwner: false,
  hasActiveRole: true,
  accessScopeCount: 0,
  roles: [{ id: ROLE_ID, name: "Sales", systemKey: null, active: true }],
  version: 1,
  createdAt: "2026-09-14T10:00:00.000Z",
};

function insertedInto(table: unknown): Record<string, unknown>[] {
  return mocks.insert.mock.calls
    .filter(([target]) => target === table)
    .map(([, values]) => values as Record<string, unknown>);
}

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

  it("links the account with Clerk master data, the chosen roles and exactly one event", async () => {
    const tx = {
      insert: (table: unknown) => ({
        values: (values: unknown) => mocks.insert(table, values),
      }),
    };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (value: unknown) => Promise<unknown>) =>
        callback(tx),
    });
    mocks.findById.mockResolvedValue(CREATED_MEMBER);

    const result = await addWorkspaceMember(input, actor);

    const [user] = insertedInto(users);
    expect(user).toMatchObject({
      clerk_user_id: "user_anna",
      primary_email: "anna@example.test",
      first_name: "Anna",
      last_name: null,
      display_name: "Anna",
      active: true,
      version: 1,
    });
    const [member] = insertedInto(workspaceMembers);
    expect(member).toMatchObject({
      user_id: user.id,
      active: true,
      version: 1,
    });
    expect(insertedInto(workspaceMemberRoles)).toEqual([
      [
        expect.objectContaining({
          workspace_member_id: member.id,
          role_id: ROLE_ID,
          role_realm: AuthRealm.Workspace,
          assigned_by_user_id: actor.userId,
        }),
      ],
    ]);
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    const event = mocks.createEvent.mock.calls[0][1];
    expect(event).toMatchObject({
      type: SecurityEventType.WorkspaceMemberAdded,
      actor: { userId: actor.userId },
      subjectId: member.id,
      metadata: { roleIds: [ROLE_ID] },
    });
    expect(JSON.stringify(event.metadata)).not.toContain("anna");
    expect(result).toEqual({ ok: true, member: CREATED_MEMBER });
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
      UsersConstraintName.ClerkUserIdUnique,
      WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked,
    ],
    [
      PostgresErrorCode.ForeignKeyViolation,
      WorkspaceMemberRolesConstraintName.RoleForeignKey,
      WorkspaceMemberErrorCode.RoleNotAssignable,
    ],
    [
      PostgresErrorCode.CheckViolation,
      UsersConstraintName.PrimaryEmailCheck,
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
