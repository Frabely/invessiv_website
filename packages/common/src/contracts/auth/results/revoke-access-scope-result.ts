import type { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";

/** Result of revoking a scoped role. */
export type RevokeAccessScopeResult =
  | { ok: true; member: WorkspaceMemberDto }
  | {
      ok: false;
      code:
        | typeof WorkspaceMemberErrorCode.MemberNotFound
        | typeof WorkspaceMemberErrorCode.ValidationError
        | typeof WorkspaceMemberErrorCode.MemberWithoutRole
        | typeof WorkspaceMemberErrorCode.AccessScopeNotFound;
      errors?: unknown;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<WorkspaceMemberDto>;
    };
