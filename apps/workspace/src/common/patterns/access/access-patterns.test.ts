import { describe, expect, it } from "vitest";

import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { SettingsTab } from "@/common/constants/access/settings-tabs";
import {
  accessCustomerProjectsEndpoint,
  workspaceMemberEndpoint,
  workspaceMemberOwnerEndpoint,
  workspaceMemberRolesEndpoint,
  workspaceRoleEndpoint,
} from "@/common/patterns/access/access-api-endpoints";
import {
  selectAssignableRoles,
  selectDefaultRoleIds,
  selectOwnerRoleIds,
} from "@/common/patterns/access/role-selection";
import {
  buildSettingsTabHref,
  resolveSettingsTab,
} from "@/common/patterns/access/settings-tab";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { formatMessage } from "@/lib/i18n/format-message";
import {
  resolveRoleDescription,
  resolveRoleLabel,
} from "@/lib/workspace/access/role-label";

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

describe("access api endpoints", () => {
  it("builds encoded member and role paths from endpoint constants", () => {
    expect(workspaceMemberEndpoint("../leads")).toBe(
      "/api/workspace/members/..%2Fleads",
    );
    expect(workspaceMemberRolesEndpoint("member-1")).toBe(
      "/api/workspace/members/member-1/roles",
    );
    expect(workspaceMemberOwnerEndpoint("member-1")).toBe(
      "/api/workspace/members/member-1/owner",
    );
    expect(workspaceRoleEndpoint("../leads")).toBe(
      "/api/workspace/roles/..%2Fleads",
    );
    expect(accessCustomerProjectsEndpoint("../leads")).toBe(
      "/api/workspace/access/customers/..%2Fleads/projects",
    );
  });
});

describe("settings labels", () => {
  const content = getSettingsPermissionsDictionary("de");

  it("translates system roles and keeps custom names", () => {
    expect(
      resolveRoleLabel(
        { name: "Workspace owner", systemKey: SystemRoleKey.WorkspaceOwner },
        content,
      ),
    ).toBe("Owner");
    expect(
      resolveRoleLabel({ name: "Vertrieb", systemKey: null }, content),
    ).toBe("Vertrieb");
    expect(
      resolveRoleDescription({ description: null, systemKey: null }, content),
    ).toBeNull();
  });

  it("fills known message placeholders and leaves unknown ones visible", () => {
    expect(formatMessage("{count} von {total}", { count: 2 })).toBe(
      "2 von {total}",
    );
  });
});
