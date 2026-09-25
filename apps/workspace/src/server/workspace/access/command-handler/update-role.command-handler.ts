import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { UpdateRoleResult } from "@invessiv/common/contracts/auth/results/update-role-result";
import type { UpdateRoleRequestDto } from "@invessiv/common/contracts/auth/update-role-request.dto";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
  PostgresErrorCode,
} from "@invessiv/db/core";
import { rolePermissions, roles } from "@invessiv/db/record-configuration";
import { RolesConstraintName } from "@invessiv/db/constraint-names/auth/roles-constraint-names";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { roleService } from "@/server/workspace/access/services/role-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

type RoleChange = {
  name: string;
  description: string | null;
  active: boolean;
  scopeAssignable: boolean;
  permissions: readonly Permission[];
  version: number;
};

/** Serializes against grantAccessScope, which share-locks the role while it checks assignability. */
async function lockRole(
  tx: ContactDatabaseTransaction,
  roleId: string,
): Promise<void> {
  await tx
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.id, roleId))
    .for("update");
}

function diffRole(current: RoleDto, next: RoleChange) {
  const addedPermissions = next.permissions.filter(
    (permission) => !current.permissions.includes(permission),
  );
  const removedPermissions = current.permissions.filter(
    (permission) => !next.permissions.includes(permission),
  );
  const changedFields = [
    ...(next.name !== current.name ? ["name"] : []),
    ...(next.description !== current.description ? ["description"] : []),
    ...(next.active !== current.active ? ["active"] : []),
    ...(addedPermissions.length > 0 || removedPermissions.length > 0
      ? ["permissions"]
      : []),
  ];

  return { addedPermissions, removedPermissions, changedFields };
}

async function applyPermissionDiff(
  tx: ContactDatabaseTransaction,
  args: {
    roleId: string;
    scopeAssignable: boolean;
    realm: AuthRealm;
    addedPermissions: readonly Permission[];
    removedPermissions: readonly Permission[];
  },
): Promise<void> {
  const { roleId, scopeAssignable, addedPermissions, removedPermissions } =
    args;

  if (removedPermissions.length > 0) {
    await tx
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role_id, roleId),
          inArray(rolePermissions.permission_key, [...removedPermissions]),
        ),
      );
  }
  if (addedPermissions.length > 0) {
    await tx.insert(rolePermissions).values(
      addedPermissions.map((permission) => ({
        role_id: roleId,
        realm: args.realm,
        role_is_system: false,
        permission_key: permission,
        permission_delegable: PERMISSION_DEFINITIONS[permission].delegable,
        role_scope_assignable: scopeAssignable,
        permission_scope_assignable:
          PERMISSION_DEFINITIONS[permission].scopeAssignable,
      })),
    );
  }
}

/** A stale version answers with the fresh role; a vanished row answers not found. */
async function resolveFailedVersionBump(
  tx: ContactDatabaseTransaction,
  roleId: string,
  isVersionConflict: boolean,
): Promise<UpdateRoleResult> {
  const fresh = isVersionConflict
    ? await roleService.findById(tx, roleId)
    : null;
  if (!fresh) {
    return { ok: false, code: RoleErrorCode.RoleNotFound };
  }

  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion: fresh.version,
      current: fresh,
    },
  };
}

async function updateRoleInTransaction(
  tx: ContactDatabaseTransaction,
  roleId: string,
  change: Omit<RoleChange, "scopeAssignable">,
  actor: WorkspaceActor,
): Promise<UpdateRoleResult> {
  await lockRole(tx, roleId);

  const current = await roleService.findById(tx, roleId);
  if (!current) {
    return { ok: false, code: RoleErrorCode.RoleNotFound };
  }
  if (current.isSystem) {
    return { ok: false, code: RoleErrorCode.SystemRoleImmutable };
  }

  const next: RoleChange = {
    ...change,
    scopeAssignable: current.scopeAssignable,
  };
  if (
    next.permissions.some(
      (permission) =>
        PERMISSION_DEFINITIONS[permission].realm !== current.realm,
    )
  ) {
    return { ok: false, code: RoleErrorCode.ValidationError, errors: [] };
  }
  if (
    next.scopeAssignable &&
    next.permissions.some(
      (permission) => !PERMISSION_DEFINITIONS[permission].scopeAssignable,
    )
  ) {
    return { ok: false, code: RoleErrorCode.PermissionNotScopeAssignable };
  }
  if (roleService.isReservedName(next.name)) {
    return { ok: false, code: RoleErrorCode.RoleNameReserved };
  }

  const { addedPermissions, removedPermissions, changedFields } = diffRole(
    current,
    next,
  );
  if (changedFields.length === 0) {
    return { ok: true, role: current };
  }

  const bump = await updateVersioned({
    tx,
    table: roles,
    id: roleId,
    expectedVersion: next.version,
    patch: {
      name: next.name,
      description: next.description,
      active: next.active,
    },
    toDto: (row) => row.version,
  });
  if (!bump.ok) {
    return resolveFailedVersionBump(
      tx,
      roleId,
      bump.code === ConcurrencyErrorCode.VersionConflict,
    );
  }

  await applyPermissionDiff(tx, {
    roleId,
    scopeAssignable: next.scopeAssignable,
    realm: current.realm,
    addedPermissions,
    removedPermissions,
  });
  await securityEventService.createSecurityEvent(tx, {
    type: SecurityEventType.RoleUpdated,
    actor: { type: ActorType.User, userId: actor.userId },
    subjectType: SecuritySubjectType.Role,
    subjectId: roleId,
    metadata: { changedFields, addedPermissions, removedPermissions },
    occurredAt: new Date(),
  });

  const role = await roleService.findById(tx, roleId);
  if (!role) {
    throw new Error("Role is missing after its update");
  }

  return { ok: true, role };
}

export async function updateRole(
  roleId: string,
  input: UpdateRoleRequestDto,
  actor: WorkspaceActor,
): Promise<UpdateRoleResult> {
  if (!accessSchemas.entityId.safeParse(roleId).success) {
    return { ok: false, code: RoleErrorCode.RoleNotFound };
  }

  const validation = accessSchemas.updateRole.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: RoleErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const change = validation.data;
  if (
    change.permissions.some(
      (permission) => !PERMISSION_DEFINITIONS[permission].delegable,
    )
  ) {
    return { ok: false, code: RoleErrorCode.PermissionNotDelegable };
  }

  const db = getDrizzleDatabaseClient();

  try {
    return await db.transaction((tx) =>
      updateRoleInTransaction(tx, roleId, change, actor),
    );
  } catch (error: unknown) {
    if (
      postgresErrorService.getViolatedConstraint(
        error,
        PostgresErrorCode.UniqueViolation,
      ) === RolesConstraintName.RealmNameUnique
    ) {
      return { ok: false, code: RoleErrorCode.RoleNameTaken };
    }
    throw error;
  }
}
