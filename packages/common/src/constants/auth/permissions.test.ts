import { describe, expect, it } from "vitest";

import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";
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

  // One dot, snake_case on both sides: `project_line_items.read` is one area, not two dots.
  it("uses dotted lowercase keys", () => {
    for (const permission of PERMISSION_VALUES) {
      expect(permission).toMatch(/^[a-z]+(?:_[a-z]+)*\.[a-z]+(?:_[a-z]+)*$/);
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

  it("only lists assignable scope types when the permission is scope-assignable", () => {
    for (const permission of PERMISSION_VALUES) {
      const definition = PERMISSION_DEFINITIONS[permission];
      if (!definition.scopeAssignable) {
        expect(definition.assignableScopeTypes).toEqual([]);
      } else {
        expect(definition.assignableScopeTypes.length).toBeGreaterThan(0);
      }
    }
  });

  it("never offers a project scope without also offering it at customer scope", () => {
    for (const permission of PERMISSION_VALUES) {
      const scopeTypes =
        PERMISSION_DEFINITIONS[permission].assignableScopeTypes;
      if (scopeTypes.includes(AccessScopeType.Project)) {
        expect(scopeTypes).toContain(AccessScopeType.Customer);
      }
    }
  });
});
