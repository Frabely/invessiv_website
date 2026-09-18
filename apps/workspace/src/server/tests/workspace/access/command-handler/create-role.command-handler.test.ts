import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import { RolePermissionsConstraintName } from "@invessiv/db/constraint-names/auth/role-permissions-constraint-names";
import { RolesConstraintName } from "@invessiv/db/constraint-names/auth/roles-constraint-names";
import { PostgresErrorCode } from "@invessiv/db/core";
import { rolePermissions, roles } from "@invessiv/db/record-configuration";
import { createRole } from "@/server/workspace/access/command-handler/create-role.command-handler";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDatabase: vi.fn(),
  findById: vi.fn(),
  createEvent: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@invessiv/db/core", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@invessiv/db/core")>()),
  getDrizzleDatabaseClient: mocks.getDatabase,
}));
vi.mock("@/server/workspace/access/services/role-read-service", () => ({
  roleReadService: { findById: mocks.findById },
}));
vi.mock("@/server/workspace/auth/services/security-event-service", () => ({
  securityEventService: { createSecurityEvent: mocks.createEvent },
}));

const actor = workspaceActorWith();

const STORED_ROLE: RoleDto = {
  id: "role-new",
  name: "Vertrieb",
  systemKey: null,
  active: true,
  description: null,
  isSystem: false,
  permissions: [Permission.LeadsRead, Permission.LeadsWrite],
  assignedMemberCount: 0,
  version: 1,
  createdAt: "2026-09-14T10:00:00.000Z",
  updatedAt: "2026-09-14T10:00:00.000Z",
};

function insertedInto(table: unknown): unknown[] {
  return mocks.insert.mock.calls
    .filter(([target]) => target === table)
    .map(([, values]) => values);
}

function failTransactionWith(violation: { code: string; constraint: string }) {
  mocks.getDatabase.mockReturnValue({
    transaction: () =>
      Promise.reject(new Error("insert failed", { cause: violation })),
  });
}

describe("createRole", () => {
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
    mocks.findById.mockResolvedValue(STORED_ROLE);
  });

  it("rejects a blank name before opening a transaction", async () => {
    const result = await createRole(
      { name: "   ", description: null, permissions: [] },
      actor,
    );

    expect(result).toMatchObject({
      ok: false,
      code: RoleErrorCode.ValidationError,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it.each(["Owner", " mitglied ", "Workspace owner"])(
    "rejects the system role name %j before opening a transaction",
    async (name) => {
      expect(
        await createRole({ name, description: null, permissions: [] }, actor),
      ).toEqual({ ok: false, code: RoleErrorCode.RoleNameReserved });
      expect(mocks.getDatabase).not.toHaveBeenCalled();
    },
  );

  it("rejects a non-delegable permission with its own code and writes nothing", async () => {
    const result = await createRole(
      {
        name: "Vertrieb",
        description: null,
        permissions: [Permission.LeadsRead, Permission.MembersManage],
      },
      actor,
    );

    expect(result).toEqual({
      ok: false,
      code: RoleErrorCode.PermissionNotDelegable,
    });
    expect(mocks.getDatabase).not.toHaveBeenCalled();
  });

  it("stores a trimmed custom role with catalog delegability and exactly one event", async () => {
    const result = await createRole(
      {
        name: "  Vertrieb ",
        description: "",
        permissions: [Permission.LeadsRead, Permission.LeadsWrite],
      },
      actor,
    );

    const [role] = insertedInto(roles) as Record<string, unknown>[];
    expect(role).toMatchObject({
      realm: AuthRealm.Workspace,
      system_key: null,
      name: "Vertrieb",
      description: null,
      is_system: false,
      active: true,
      version: 1,
    });
    expect(insertedInto(rolePermissions)).toEqual([
      [Permission.LeadsRead, Permission.LeadsWrite].map((permission) => ({
        role_id: role.id,
        realm: AuthRealm.Workspace,
        role_is_system: false,
        permission_key: permission,
        permission_delegable: true,
        role_scope_assignable: false,
        permission_scope_assignable: false,
      })),
    ]);
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    expect(mocks.createEvent.mock.calls[0][1]).toMatchObject({
      type: SecurityEventType.RoleCreated,
      actor: { userId: actor.userId },
      subjectType: SecuritySubjectType.Role,
      subjectId: role.id,
      metadata: { permissions: [Permission.LeadsRead, Permission.LeadsWrite] },
    });
    expect(result).toEqual({ ok: true, role: STORED_ROLE });
  });

  it("creates a role without permissions and skips the permission insert", async () => {
    await createRole(
      { name: "Leer", description: null, permissions: [] },
      actor,
    );

    expect(insertedInto(roles)).toHaveLength(1);
    expect(insertedInto(rolePermissions)).toEqual([]);
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
  });

  it("answers a duplicate name with its own code", async () => {
    failTransactionWith({
      code: PostgresErrorCode.UniqueViolation,
      constraint: RolesConstraintName.RealmNameUnique,
    });

    expect(
      await createRole(
        { name: "Vertrieb", description: null, permissions: [] },
        actor,
      ),
    ).toEqual({ ok: false, code: RoleErrorCode.RoleNameTaken });
  });

  it("rethrows other database failures so the route logs them", async () => {
    failTransactionWith({
      code: PostgresErrorCode.ForeignKeyViolation,
      constraint: RolePermissionsConstraintName.PermissionForeignKey,
    });

    await expect(
      createRole(
        {
          name: "Vertrieb",
          description: null,
          permissions: [Permission.LeadsRead],
        },
        actor,
      ),
    ).rejects.toThrow("insert failed");
  });
});
