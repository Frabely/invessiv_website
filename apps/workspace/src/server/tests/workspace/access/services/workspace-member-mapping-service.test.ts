import { describe, expect, it } from "vitest";

import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { WorkspaceMemberRoleRow } from "@invessiv/common/contracts/auth/rows/workspace-member-role-row";
import type { WorkspaceMemberScopedRoleRow } from "@invessiv/common/contracts/auth/rows/workspace-member-scoped-role-row";
import { workspaceMemberMappingService } from "@/server/workspace/access/services/workspace-member-mapping-service";

const CREATED_AT = new Date("2026-09-13T10:00:00.000Z");

function row(
  overrides: Partial<WorkspaceMemberRoleRow>,
): WorkspaceMemberRoleRow {
  return {
    member_id: "member-1",
    user_id: "user-1",
    display_name: "Moritz Hecht",
    primary_email: "owner@example.test",
    member_active: true,
    member_version: 4,
    member_created_at: CREATED_AT,
    role_id: null,
    role_name: null,
    role_system_key: null,
    role_active: null,
    ...overrides,
  };
}

describe("workspaceMemberMappingService.mapRowsToMembers", () => {
  it("maps a member without any role assignment", () => {
    expect(workspaceMemberMappingService.mapRowsToMembers([row({})])).toEqual([
      {
        id: "member-1",
        userId: "user-1",
        displayName: "Moritz Hecht",
        primaryEmail: "owner@example.test",
        active: true,
        isOwner: false,
        hasActiveRole: false,
        accessScopeCount: 0,
        roles: [],
        version: 4,
        createdAt: "2026-09-13T10:00:00.000Z",
      },
    ]);
  });

  it("marks the owner assignment as flag and keeps it out of the role list", () => {
    const [member] = workspaceMemberMappingService.mapRowsToMembers([
      row({
        role_id: "owner-role",
        role_name: "Workspace owner",
        role_system_key: SystemRoleKey.WorkspaceOwner,
        role_active: true,
      }),
      row({
        role_id: "custom-role",
        role_name: "Sales",
        role_active: false,
      }),
    ]);

    expect(member.isOwner).toBe(true);
    expect(member.hasActiveRole).toBe(true);
    expect(member.roles).toEqual([
      { id: "custom-role", name: "Sales", systemKey: null, active: false },
    ]);
  });

  it("flags a member whose assigned roles are all inactive", () => {
    const [member] = workspaceMemberMappingService.mapRowsToMembers([
      row({ role_id: "sales", role_name: "Sales", role_active: false }),
      row({ role_id: "support", role_name: "Support", role_active: false }),
    ]);

    expect(member.roles).toHaveLength(2);
    expect(member.hasActiveRole).toBe(false);
  });

  it("counts a member as having an active role as soon as one role is active", () => {
    const [member] = workspaceMemberMappingService.mapRowsToMembers([
      row({ role_id: "sales", role_name: "Sales", role_active: false }),
      row({ role_id: "support", role_name: "Support", role_active: true }),
    ]);

    expect(member.hasActiveRole).toBe(true);
  });

  it("groups rows per member and keeps the query order of members", () => {
    const members = workspaceMemberMappingService.mapRowsToMembers([
      row({ member_id: "member-b", display_name: "Anna" }),
      row({
        member_id: "member-a",
        display_name: "Ben",
        role_id: "custom-z",
        role_name: "Zeta",
        role_active: true,
      }),
      row({
        member_id: "member-a",
        display_name: "Ben",
        role_id: "system-member",
        role_name: "Workspace member",
        role_system_key: SystemRoleKey.WorkspaceMember,
        role_active: true,
      }),
    ]);

    expect(members.map((member) => member.id)).toEqual([
      "member-b",
      "member-a",
    ]);
    expect(members[1].roles.map((role) => role.id)).toEqual([
      "system-member",
      "custom-z",
    ]);
  });

  describe("scoped grants", () => {
    function scoped(
      overrides: Partial<WorkspaceMemberScopedRoleRow> = {},
    ): WorkspaceMemberScopedRoleRow {
      return {
        workspace_member_id: "member-1",
        role_active: true,
        ...overrides,
      };
    }

    it("counts every scoped grant of the member, inactive roles included", () => {
      const [member] = workspaceMemberMappingService.mapRowsToMembers(
        [row({})],
        [scoped(), scoped(), scoped({ role_active: false })],
      );

      expect(member.accessScopeCount).toBe(3);
    });

    it("counts grants per member without mixing them up", () => {
      const members = workspaceMemberMappingService.mapRowsToMembers(
        [row({ member_id: "member-1" }), row({ member_id: "member-2" })],
        [
          scoped({ workspace_member_id: "member-1" }),
          scoped({ workspace_member_id: "member-1" }),
          scoped({ workspace_member_id: "member-2" }),
        ],
      );

      expect(members.map((member) => member.accessScopeCount)).toEqual([2, 1]);
    });

    it("gives a member with only an active scoped role an active role", () => {
      const [member] = workspaceMemberMappingService.mapRowsToMembers(
        [row({})],
        [scoped()],
      );

      expect(member.hasActiveRole).toBe(true);
    });

    it("keeps a member without an active role when every scoped role is inactive", () => {
      const [member] = workspaceMemberMappingService.mapRowsToMembers(
        [row({})],
        [scoped({ role_active: false })],
      );

      expect(member.hasActiveRole).toBe(false);
      expect(member.accessScopeCount).toBe(1);
    });

    it("reports zero grants when none are passed", () => {
      const [member] = workspaceMemberMappingService.mapRowsToMembers([
        row({}),
      ]);

      expect(member.accessScopeCount).toBe(0);
    });
  });
});
