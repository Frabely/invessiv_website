import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SystemRoleKey } from "@invessiv/common/constants/auth/system-role-keys";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { UpdateRoleRequestDto } from "@invessiv/common/contracts/auth/update-role-request.dto";
import { RolesConstraintName } from "@invessiv/db/constraint-names/auth/roles-constraint-names";
import { PostgresErrorCode } from "@invessiv/db/core";
import { rolePermissions, roles } from "@invessiv/db/record-configuration";
import { updateRole } from "@/server/workspace/access/command-handler/update-role.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  findById: vi.fn(),
  updateVersioned: vi.fn(),
  createEvent: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock(
  "@/server/workspace/access/services/role-service",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/server/workspace/access/services/role-service")
      >();
    return {
      roleService: { ...original.roleService, findById: mocks.findById },
    };
  },
);
vi.mock("@/server/workspace/shared/update-versioned", () => ({
  updateVersioned: mocks.updateVersioned,
}));
vi.mock("@/server/shared/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.createEvent },
}));

const ROLE_ID = "9a1b2c3d-4e5f-4a6b-8c7d-0e1f2a3b4c5d";
const actor = workspaceActorWith();

const CURRENT: RoleDto = {
  realm: "workspace",
  id: ROLE_ID,
  name: "Vertrieb",
  systemKey: null,
  active: true,
  scopeAssignable: false,
  description: null,
  isSystem: false,
  permissions: [Permission.LeadsRead, Permission.LeadsWrite],
  assignedMemberCount: 2,
  version: 4,
  createdAt: "2026-09-13T10:00:00.000Z",
  updatedAt: "2026-09-13T10:00:00.000Z",
};

const UNCHANGED_INPUT: UpdateRoleRequestDto = {
  name: CURRENT.name,
  description: CURRENT.description,
  active: CURRENT.active,
  permissions: CURRENT.permissions,
  version: CURRENT.version,
};

function failTransactionWith(violation: { code: string; constraint: string }) {
  mocks.getDatabase.mockReturnValue({
    transaction: () =>
      Promise.reject(new Error("update failed", { cause: violation })),
  });
}

describe("updateRole", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    const tx = {
      insert: (table: unknown) => ({
        values: (values: unknown) => mocks.insert(table, values),
      }),
      delete: (table: unknown) => ({ where: () => mocks.delete(table) }),
      select: () => ({
        from: (table: unknown) => ({
          where: () => ({
            for: () => mocks.select(table),
            limit: () => mocks.select(table),
          }),
        }),
      }),
    };
    mocks.getDatabase.mockReturnValue({
      transaction: (callback: (value: unknown) => Promise<unknown>) =>
        callback(tx),
    });
    mocks.findById.mockResolvedValue(CURRENT);
    mocks.select.mockResolvedValue([]);
  });

  it("answers a malformed id with not found without opening a transaction", async () => {
    expect(await updateRole("not-a-uuid", UNCHANGED_INPUT, actor)).toEqual({
      ok: false,
      code: RoleErrorCode.RoleNotFound,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("rejects a non-delegable permission before opening a transaction", async () => {
    const result = await updateRole(
      ROLE_ID,
      { ...UNCHANGED_INPUT, permissions: [Permission.RolesManage] },
      actor,
    );

    expect(result).toEqual({
      ok: false,
      code: RoleErrorCode.PermissionNotDelegable,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("answers a missing role with not found", async () => {
    mocks.findById.mockResolvedValue(null);

    expect(await updateRole(ROLE_ID, UNCHANGED_INPUT, actor)).toEqual({
      ok: false,
      code: RoleErrorCode.RoleNotFound,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("refuses to change a system role and writes nothing", async () => {
    mocks.findById.mockResolvedValue({
      ...CURRENT,
      isSystem: true,
      systemKey: SystemRoleKey.WorkspaceMember,
    });

    const result = await updateRole(
      ROLE_ID,
      { ...UNCHANGED_INPUT, name: "Umbenannt" },
      actor,
    );

    expect(result).toEqual({
      ok: false,
      code: RoleErrorCode.SystemRoleImmutable,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("returns the unchanged role without a version bump or event", async () => {
    const result = await updateRole(
      ROLE_ID,
      {
        ...UNCHANGED_INPUT,
        permissions: [Permission.LeadsWrite, Permission.LeadsRead],
      },
      actor,
    );

    expect(result).toEqual({ ok: true, role: CURRENT });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("rejects a customer role update that adds a workspace-only permission", async () => {
    mocks.findById.mockResolvedValue({
      ...CURRENT,
      scopeAssignable: true,
      permissions: [Permission.CustomersRead],
    });

    expect(
      await updateRole(
        ROLE_ID,
        {
          ...UNCHANGED_INPUT,
          permissions: [Permission.CustomersRead, Permission.LeadsRead],
        },
        actor,
      ),
    ).toEqual({ ok: false, code: RoleErrorCode.PermissionNotScopeAssignable });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("rejects renaming a custom role to a system role name", async () => {
    const result = await updateRole(
      ROLE_ID,
      { ...UNCHANGED_INPUT, name: " MITGLIED " },
      actor,
    );

    expect(result).toEqual({
      ok: false,
      code: RoleErrorCode.RoleNameReserved,
    });
    expect(mocks.updateVersioned).not.toHaveBeenCalled();
  });

  it("bumps the version first, then applies the permission diff and records the changed fields", async () => {
    const updated: RoleDto = {
      ...CURRENT,
      name: "Vertrieb Nord",
      active: false,
      permissions: [Permission.LeadsRead, Permission.LeadsImport],
      version: 5,
    };
    const calls: string[] = [];
    mocks.findById
      .mockResolvedValueOnce(CURRENT)
      .mockResolvedValueOnce(updated);
    mocks.updateVersioned.mockImplementation(async () => {
      calls.push("bump");
      return { ok: true, value: 5 };
    });
    mocks.delete.mockImplementation(async () => {
      calls.push("delete");
    });
    mocks.insert.mockImplementation(async () => {
      calls.push("insert");
    });
    mocks.createEvent.mockImplementation(async () => {
      calls.push("event");
    });

    const result = await updateRole(
      ROLE_ID,
      {
        name: "Vertrieb Nord",
        description: null,
        active: false,
        permissions: [Permission.LeadsRead, Permission.LeadsImport],
        version: 4,
      },
      actor,
    );

    expect(calls).toEqual(["bump", "delete", "insert", "event"]);
    expect(mocks.updateVersioned).toHaveBeenCalledWith(
      expect.objectContaining({
        table: roles,
        id: ROLE_ID,
        expectedVersion: 4,
        patch: {
          name: "Vertrieb Nord",
          description: null,
          active: false,
        },
      }),
    );
    expect(mocks.delete).toHaveBeenCalledWith(rolePermissions);
    expect(mocks.insert).toHaveBeenCalledWith(rolePermissions, [
      {
        role_id: ROLE_ID,
        realm: AuthRealm.Workspace,
        role_is_system: false,
        permission_key: Permission.LeadsImport,
        permission_delegable: true,
        role_scope_assignable: false,
        permission_scope_assignable: false,
      },
    ]);
    expect(mocks.createEvent.mock.calls[0][1]).toMatchObject({
      type: SecurityEventType.RoleUpdated,
      actor: { userId: actor.userId },
      subjectId: ROLE_ID,
      metadata: {
        changedFields: ["name", "active", "permissions"],
        addedPermissions: [Permission.LeadsImport],
        removedPermissions: [Permission.LeadsWrite],
      },
    });
    expect(result).toEqual({ ok: true, role: updated });
  });

  it("answers a stale version with the fresh role and writes nothing else", async () => {
    const fresh: RoleDto = { ...CURRENT, name: "Vertrieb Süd", version: 5 };
    mocks.findById.mockResolvedValueOnce(CURRENT).mockResolvedValueOnce(fresh);
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 5,
        current: 5,
      },
    });

    const result = await updateRole(
      ROLE_ID,
      { ...UNCHANGED_INPUT, name: "Vertrieb Nord" },
      actor,
    );

    expect(result).toEqual({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      conflict: {
        code: ConcurrencyErrorCode.VersionConflict,
        currentVersion: 5,
        current: fresh,
      },
    });
    expect(mocks.delete).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.createEvent).not.toHaveBeenCalled();
  });

  it("answers a role that vanished during the update with not found", async () => {
    mocks.updateVersioned.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.NotFound,
    });

    expect(
      await updateRole(
        ROLE_ID,
        { ...UNCHANGED_INPUT, name: "Vertrieb Nord" },
        actor,
      ),
    ).toEqual({ ok: false, code: RoleErrorCode.RoleNotFound });
  });

  it("answers a duplicate name with its own code", async () => {
    failTransactionWith({
      code: PostgresErrorCode.UniqueViolation,
      constraint: RolesConstraintName.RealmNameUnique,
    });

    expect(
      await updateRole(ROLE_ID, { ...UNCHANGED_INPUT, name: "Support" }, actor),
    ).toEqual({ ok: false, code: RoleErrorCode.RoleNameTaken });
  });
});
