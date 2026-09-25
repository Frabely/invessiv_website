import { describe, expect, it } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import type { RolePermissionRow } from "@invessiv/common/contracts/auth/rows/role-permission-row";
import { roleMappingService } from "@/server/workspace/access/services/role-mapping-service";

const CREATED_AT = new Date("2026-09-13T10:00:00.000Z");
const UPDATED_AT = new Date("2026-09-13T11:00:00.000Z");

function row(overrides: Partial<RolePermissionRow>): RolePermissionRow {
  return {
    realm: "workspace",
    id: "role-custom",
    name: "Sales",
    system_key: null,
    description: null,
    is_system: false,
    active: true,
    version: 1,
    created_at: CREATED_AT,
    updated_at: UPDATED_AT,
    permission_key: null,
    ...overrides,
  };
}

describe("roleMappingService.mapRowsToRoles", () => {
  it("groups permission rows per role in catalog order and maps every field", () => {
    const roles = roleMappingService.mapRowsToRoles(
      [
        row({
          permission_key: Permission.LeadsWrite,
          description: "Sales team",
        }),
        row({
          permission_key: Permission.LeadsRead,
          description: "Sales team",
        }),
      ],
      [{ role_id: "role-custom", assigned_member_count: 3 }],
    );

    expect(roles).toEqual([
      {
        realm: "workspace",
        id: "role-custom",
        name: "Sales",
        systemKey: null,
        active: true,
        scopeAssignable: false,
        description: "Sales team",
        isSystem: false,
        permissions: [Permission.LeadsRead, Permission.LeadsWrite],
        assignedMemberCount: 3,
        version: 1,
        createdAt: "2026-09-13T10:00:00.000Z",
        updatedAt: "2026-09-13T11:00:00.000Z",
      },
    ]);
  });

  it("returns an empty permission list and zero members for a bare role", () => {
    const [role] = roleMappingService.mapRowsToRoles([row({})], []);

    expect(role.permissions).toEqual([]);
    expect(role.assignedMemberCount).toBe(0);
  });

  it("drops unknown permission keys instead of passing them on", () => {
    const [role] = roleMappingService.mapRowsToRoles(
      [row({ permission_key: "leads.teleport" })],
      [],
    );

    expect(role.permissions).toEqual([]);
  });

  it("keeps the portal realm and portal permission in the role DTO", () => {
    const [role] = roleMappingService.mapRowsToRoles(
      [
        row({
          id: "portal-role",
          realm: "portal",
          permission_key: Permission.PortalAccess,
        }),
      ],
      [],
    );
    expect(role.realm).toBe("portal");
    expect(role.permissions).toEqual([Permission.PortalAccess]);
  });

  it("orders system roles by catalog order before custom roles by name", () => {
    const roles = roleMappingService.mapRowsToRoles(
      [
        row({ id: "custom-z", name: "Zeta" }),
        row({
          id: "member",
          name: "Workspace member",
          system_key: SystemRoleKey.WorkspaceMember,
          is_system: true,
        }),
        row({ id: "custom-a", name: "Alpha" }),
        row({
          id: "owner",
          name: "Workspace owner",
          system_key: SystemRoleKey.WorkspaceOwner,
          is_system: true,
        }),
      ],
      [],
    );

    expect(roles.map((role) => role.id)).toEqual([
      "owner",
      "member",
      "custom-a",
      "custom-z",
    ]);
  });
});
