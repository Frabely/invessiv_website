import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { UpdateRoleResult } from "@invessiv/common/contracts/auth/results/update-role-result";
import type { UpdateRoleRequestDto } from "@invessiv/common/contracts/auth/update-role-request.dto";
import { getDrizzleDatabaseClient, PostgresErrorCode } from "@invessiv/db/core";
import { rolePermissions, roles } from "@invessiv/db/record-configuration";
import { AuthConstraintName } from "@invessiv/db/record-configuration/auth/auth-constraint-names";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { reservedRoleNameService } from "@/server/workspace/access/services/reserved-role-name-service";
import { roleReadService } from "@/server/workspace/access/services/role-read-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

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

  const { name, description, active, permissions, version } = validation.data;
  if (
    permissions.some(
      (permission) => !PERMISSION_DEFINITIONS[permission].delegable,
    )
  ) {
    return { ok: false, code: RoleErrorCode.PermissionNotDelegable };
  }

  const db = getDrizzleDatabaseClient();

  try {
    return await db.transaction(async (tx): Promise<UpdateRoleResult> => {
      const current = await roleReadService.findById(tx, roleId);
      if (!current) {
        return { ok: false, code: RoleErrorCode.RoleNotFound };
      }
      if (current.isSystem) {
        return { ok: false, code: RoleErrorCode.SystemRoleImmutable };
      }
      // An unchanged legacy name stays editable; only a new name must not look like a system role.
      if (name !== current.name && reservedRoleNameService.isReserved(name)) {
        return { ok: false, code: RoleErrorCode.RoleNameReserved };
      }

      const addedPermissions = permissions.filter(
        (permission) => !current.permissions.includes(permission),
      );
      const removedPermissions = current.permissions.filter(
        (permission) => !permissions.includes(permission),
      );
      const changedFields = [
        ...(name !== current.name ? ["name"] : []),
        ...(description !== current.description ? ["description"] : []),
        ...(active !== current.active ? ["active"] : []),
        ...(addedPermissions.length > 0 || removedPermissions.length > 0
          ? ["permissions"]
          : []),
      ];
      if (changedFields.length === 0) {
        return { ok: true, role: current };
      }

      const bump = await updateVersioned({
        tx,
        table: roles,
        id: roleId,
        expectedVersion: version,
        patch: { name, description, active },
        toDto: (row) => row.version,
      });
      if (!bump.ok) {
        const fresh =
          bump.code === ConcurrencyErrorCode.VersionConflict
            ? await roleReadService.findById(tx, roleId)
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

      if (removedPermissions.length > 0) {
        await tx
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.role_id, roleId),
              inArray(rolePermissions.permission_key, removedPermissions),
            ),
          );
      }
      if (addedPermissions.length > 0) {
        await tx.insert(rolePermissions).values(
          addedPermissions.map((permission) => ({
            role_id: roleId,
            realm: AuthRealm.Workspace,
            role_is_system: false,
            permission_key: permission,
            permission_delegable: PERMISSION_DEFINITIONS[permission].delegable,
          })),
        );
      }

      await securityEventService.createSecurityEvent(tx, {
        type: SecurityEventType.RoleUpdated,
        actor: { type: ActorType.User, userId: actor.userId },
        subjectType: SecuritySubjectType.Role,
        subjectId: roleId,
        metadata: { changedFields, addedPermissions, removedPermissions },
        occurredAt: new Date(),
      });

      const role = await roleReadService.findById(tx, roleId);
      if (!role) {
        throw new Error("Role is missing after its update");
      }

      return { ok: true, role };
    });
  } catch (error: unknown) {
    if (
      postgresErrorService.getViolatedConstraint(
        error,
        PostgresErrorCode.UniqueViolation,
      ) === AuthConstraintName.RolesRealmNameUnique
    ) {
      return { ok: false, code: RoleErrorCode.RoleNameTaken };
    }
    throw error;
  }
}
