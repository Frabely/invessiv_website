import { describe, expect, it } from "vitest";

import {
  AUTH_REALM_VALUES,
  AuthRealm,
  WORKSPACE_REALM_VALUES,
} from "@invessiv/common/constants/auth/auth-realms";
import {
  PERMISSION_DEFINITIONS,
  WORKSPACE_PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permission-definitions";
import {
  Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";

describe("AuthRealm", () => {
  it("contains exactly workspace and portal", () => {
    expect(AUTH_REALM_VALUES).toEqual(["workspace", "portal"]);
    expect(AUTH_REALM_VALUES).toEqual(Object.values(AuthRealm));
    expect(new Set(AUTH_REALM_VALUES).size).toBe(AUTH_REALM_VALUES.length);
    expect(WORKSPACE_REALM_VALUES).toEqual([AuthRealm.Workspace]);
  });
});

describe("Permission", () => {
  it("lists every const value exactly once", () => {
    expect(PERMISSION_VALUES).toEqual(Object.values(Permission));
    expect(new Set(PERMISSION_VALUES).size).toBe(PERMISSION_VALUES.length);
  });

  it("uses dotted lowercase keys", () => {
    for (const permission of PERMISSION_VALUES) {
      expect(permission).toMatch(/^[a-z]+\.[a-z]+$/);
    }
  });

  it("defines every permission and nothing else", () => {
    expect(Object.keys(PERMISSION_DEFINITIONS).sort()).toEqual(
      [...PERMISSION_VALUES].sort(),
    );
  });

  it("keeps the highly critical permissions non-delegable", () => {
    const nonDelegable = PERMISSION_VALUES.filter(
      (permission) => !PERMISSION_DEFINITIONS[permission].delegable,
    );

    expect(nonDelegable).toEqual([
      Permission.RolesManage,
      Permission.MembersManage,
      Permission.DataExport,
      Permission.DataPurge,
      Permission.SecurityAudit,
    ]);
  });

  it("keeps credentials.reveal a regular delegable permission", () => {
    expect(PERMISSION_DEFINITIONS[Permission.CredentialsReveal].delegable).toBe(
      true,
    );
  });

  it("derives the workspace permissions from the definitions", () => {
    expect(WORKSPACE_PERMISSION_VALUES).toEqual(PERMISSION_VALUES);
  });
});
