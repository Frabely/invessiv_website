import "server-only";

import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { AuthRealm } from "@invessiv/common/constants/auth/auth-realms";
import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { PERMISSION_DEFINITIONS } from "@invessiv/common/constants/auth/permission-definitions";
import { SecurityEventType } from "@invessiv/common/constants/auth/security-event-types";
import { SecuritySubjectType } from "@invessiv/common/constants/auth/security-subject-types";
import type { CreateRoleRequestDto } from "@invessiv/common/contracts/auth/create-role-request.dto";
import type { CreateRoleResult } from "@invessiv/common/contracts/auth/results/create-role-result";
import { getDrizzleDatabaseClient, PostgresErrorCode } from "@invessiv/db/core";
import { rolePermissions, roles } from "@invessiv/db/record-configuration";
import { RolesConstraintName } from "@invessiv/db/constraint-names/auth/roles-constraint-names";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessSchemas } from "@/server/workspace/access/services/access-schemas";
import { reservedRoleNameService } from "@/server/workspace/access/services/reserved-role-name-service";
import { roleReadService } from "@/server/workspace/access/services/role-read-service";
import { securityEventService } from "@/server/workspace/auth/services/security-event-service";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

export async function createRole(
  input: CreateRoleRequestDto,
  actor: WorkspaceActor,
): Promise<CreateRoleResult> {
  const validation = accessSchemas.createRole.safeParse(input);
  if (!validation.success) {
    return {
      ok: false,
      code: RoleErrorCode.ValidationError,
      errors: validation.error.issues,
    };
  }

  const { name, description, permissions } = validation.data;
  // System roles appear under their translated label, so a custom role must not look like one.
  if (reservedRoleNameService.isReserved(name)) {
    return { ok: false, code: RoleErrorCode.RoleNameReserved };
  }
  // Delegability comes from the catalog in code, never from the request.
  if (
    permissions.some(
      (permission) => !PERMISSION_DEFINITIONS[permission].delegable,
    )
  ) {
    return { ok: false, code: RoleErrorCode.PermissionNotDelegable };
  }

  const db = getDrizzleDatabaseClient();

  try {
    return await db.transaction(async (tx): Promise<CreateRoleResult> => {
      const now = new Date();
      const roleId = crypto.randomUUID();

      await tx.insert(roles).values({
        id: roleId,
        realm: AuthRealm.Workspace,
        system_key: null,
        name,
        description,
        is_system: false,
        active: true,
        version: 1,
        created_at: now,
        updated_at: now,
      });

      if (permissions.length > 0) {
        await tx.insert(rolePermissions).values(
          permissions.map((permission) => ({
            role_id: roleId,
            realm: AuthRealm.Workspace,
            role_is_system: false,
            permission_key: permission,
            permission_delegable: PERMISSION_DEFINITIONS[permission].delegable,
          })),
        );
      }

      await securityEventService.createSecurityEvent(tx, {
        type: SecurityEventType.RoleCreated,
        actor: { type: ActorType.User, userId: actor.userId },
        subjectType: SecuritySubjectType.Role,
        subjectId: roleId,
        metadata: { permissions },
        occurredAt: now,
      });

      const role = await roleReadService.findById(tx, roleId);
      if (!role) {
        throw new Error("Role is missing inside its creating transaction");
      }

      return { ok: true, role };
    });
  } catch (error: unknown) {
    // A catalog mismatch (permission missing in the database) is not the owner's fault and
    // deliberately stays a logged 500 instead of a user-facing code.
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
