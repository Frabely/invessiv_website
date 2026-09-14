import type { z } from "zod";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";

/** Shared by granting and revoking the owner role; each path returns only its own codes. */
export type ChangeWorkspaceOwnerResult =
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
        | typeof WorkspaceMemberErrorCode.AlreadyOwner
        | typeof WorkspaceMemberErrorCode.NotOwner
        | typeof WorkspaceMemberErrorCode.LastActiveOwner
        | typeof WorkspaceMemberErrorCode.SelfOwnerRevocation
        | typeof WorkspaceMemberErrorCode.MemberWithoutRole;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<WorkspaceMemberDto>;
    };
