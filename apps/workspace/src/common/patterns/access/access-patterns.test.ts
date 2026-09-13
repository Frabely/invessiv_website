import { describe, expect, it } from "vitest";

import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { SettingsTab } from "@/common/constants/access/settings-tabs";
import {
  selectAssignableRoles,
  selectDefaultRoleIds,
  selectOwnerRoleIds,
} from "@/common/patterns/access/role-selection";
import {
  buildSettingsTabHref,
  resolveSettingsTab,
} from "@/common/patterns/access/settings-tab";

function role(overrides: Partial<RoleDto>): RoleDto {
  return {
    id: "role",
    name: "Role",
    systemKey: null,
    active: true,
    description: null,
    isSystem: false,
    permissions: [],
    assignedMemberCount: 0,
    version: 1,
    createdAt: "2026-09-13T10:00:00.000Z",
    updatedAt: "2026-09-13T10:00:00.000Z",
    ...overrides,
  };
}

const ROLES = [
  role({
    id: "owner",
    systemKey: SystemRoleKey.WorkspaceOwner,
    isSystem: true,
  }),
  role({
    id: "member",
    systemKey: SystemRoleKey.WorkspaceMember,
    isSystem: true,
  }),
  role({ id: "sales" }),
  role({ id: "retired", active: false }),
];

describe("role selection", () => {
  it("offers active non-owner roles and keeps inactive ones the member holds", () => {
    expect(selectAssignableRoles(ROLES, []).map((item) => item.id)).toEqual([
      "member",
      "sales",
    ]);
    expect(
      selectAssignableRoles(ROLES, ["retired"]).map((item) => item.id),
    ).toEqual(["member", "sales", "retired"]);
  });

  it("finds the owner role and preselects the member role", () => {
    expect(selectOwnerRoleIds(ROLES)).toEqual(["owner"]);
    expect(selectDefaultRoleIds(ROLES)).toEqual(["member"]);
  });
});

describe("settings tab", () => {
  it("opens the roles tab only with roles.manage", () => {
    expect(resolveSettingsTab("roles", true)).toBe(SettingsTab.Roles);
    expect(resolveSettingsTab("roles", false)).toBe(SettingsTab.Members);
    expect(resolveSettingsTab(["roles", "members"], true)).toBe(
      SettingsTab.Roles,
    );
    expect(resolveSettingsTab(undefined, true)).toBe(SettingsTab.Members);
  });

  it("keeps the members tab at the plain base path", () => {
    expect(buildSettingsTabHref("/de/settings", SettingsTab.Members)).toBe(
      "/de/settings",
    );
    expect(buildSettingsTabHref("/de/settings", SettingsTab.Roles)).toBe(
      "/de/settings?tab=roles",
    );
  });
});
