import type { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import type { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ClerkCandidateDto } from "@invessiv/common/contracts/auth/clerk-candidate.dto";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";

/** A 409 carries the fresh state so the dialog can show it without dropping the input. */
export type MemberMutationClientResult =
  | { ok: true; member: WorkspaceMemberDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: WorkspaceMemberDto;
    }
  | { ok: false; code: WorkspaceMemberErrorCode };

export type RoleMutationClientResult =
  | { ok: true; role: RoleDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: RoleDto;
    }
  | { ok: false; code: RoleErrorCode };

export type ClerkCandidatesClientResult =
  | { ok: true; candidates: ClerkCandidateDto[] }
  | { ok: false; code: WorkspaceMemberErrorCode };
