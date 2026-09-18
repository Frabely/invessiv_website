import type { z } from "zod";
import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";

export type UpdateRoleResult =
  | { ok: true; role: RoleDto }
  | {
      ok: false;
      code: typeof RoleErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code:
        | typeof RoleErrorCode.RoleNotFound
        | typeof RoleErrorCode.RoleNameTaken
        | typeof RoleErrorCode.RoleNameReserved
        | typeof RoleErrorCode.PermissionNotDelegable
        | typeof RoleErrorCode.PermissionNotScopeAssignable
        | typeof RoleErrorCode.ScopeAssignmentsExist
        | typeof RoleErrorCode.WorkspaceAssignmentsExist
        | typeof RoleErrorCode.SystemRoleImmutable;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<RoleDto>;
    };
