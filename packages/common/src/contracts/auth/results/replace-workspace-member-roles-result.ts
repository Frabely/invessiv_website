import type { z } from "zod";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";

export type ReplaceWorkspaceMemberRolesResult =
  | { ok: true; member: WorkspaceMemberDto }
  | {
      ok: false;
      code: typeof WorkspaceMemberErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code:
        | typeof WorkspaceMemberErrorCode.MemberNotFound
        | typeof WorkspaceMemberErrorCode.RoleNotAssignable
        | typeof WorkspaceMemberErrorCode.OwnerRoleNotAssignable
        | typeof WorkspaceMemberErrorCode.MemberWithoutRole;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<WorkspaceMemberDto>;
    };
