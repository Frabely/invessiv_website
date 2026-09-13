import { describe, expect, it } from "vitest";

import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import {
  Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import { SYSTEM_ROLE_DEFINITIONS } from "@invessiv/common/constants/auth/system-role-definitions";
import {
  SYSTEM_ROLE_KEY_VALUES,
  SystemRoleKey,
} from "@invessiv/common/constants/auth/system-role-keys";

describe("SystemRoleKey", () => {
  it("contains the exact system role keys without duplicates", () => {
    expect(SYSTEM_ROLE_KEY_VALUES).toEqual([
      "workspace_owner",
      "workspace_member",
      "workspace_credentials_manager",
    ]);
    expect(SYSTEM_ROLE_KEY_VALUES).toEqual(Object.values(SystemRoleKey));
    expect(new Set(SYSTEM_ROLE_KEY_VALUES).size).toBe(
      SYSTEM_ROLE_KEY_VALUES.length,
    );
  });
});

describe("SYSTEM_ROLE_DEFINITIONS", () => {
  const definitions = Object.values(SYSTEM_ROLE_DEFINITIONS);

  it("uses unique role ids and names", () => {
    expect(new Set(definitions.map((role) => role.id)).size).toBe(
      definitions.length,
    );
    expect(new Set(definitions.map((role) => role.name)).size).toBe(
      definitions.length,
    );
  });

  it("gives the owner every workspace permission", () => {
    expect(
      [
        ...SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceOwner].permissions,
      ].sort(),
    ).toEqual([...PERMISSION_VALUES].sort());
  });

  it("keeps the member role operational without deleting or revealing", () => {
    const permissions: readonly Permission[] =
      SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceMember].permissions;

    expect(permissions).not.toContain(Permission.LeadsDelete);
    expect(permissions).not.toContain(Permission.FilesDelete);
    expect(permissions).not.toContain(Permission.CredentialsReveal);
    expect(permissions).not.toContain(Permission.CredentialsWrite);
    expect(permissions).not.toContain(Permission.PortalAccessManage);
    expect(
      permissions.every(
        (permission) => PERMISSION_DEFINITIONS[permission].delegable,
      ),
    ).toBe(true);
  });

  it("grants the credentials manager only credentials.reveal", () => {
    expect(
      SYSTEM_ROLE_DEFINITIONS[SystemRoleKey.WorkspaceCredentialsManager]
        .permissions,
    ).toEqual([Permission.CredentialsReveal]);
  });

  it("never mixes realms inside a system role", () => {
    for (const role of definitions) {
      for (const permission of role.permissions) {
        expect(PERMISSION_DEFINITIONS[permission].realm).toBe(role.realm);
      }
    }
  });

  it("lists no permission twice inside a role", () => {
    for (const role of definitions) {
      expect(new Set(role.permissions).size).toBe(role.permissions.length);
    }
  });
});
