import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { ClerkUserProfile } from "@/server/workspace/auth/clerk-user-profile-types";

/** Reads run on the pooled client or inside a transaction alike. */
export type AccessDatabaseExecutor = Pick<ContactDatabaseTransaction, "select">;

export type RoleAssignabilityResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | typeof WorkspaceMemberErrorCode.RoleNotAssignable
        | typeof WorkspaceMemberErrorCode.OwnerRoleNotAssignable;
    };

export type MemberVersionBumpResult =
  | { ok: true }
  | { ok: false; code: typeof WorkspaceMemberErrorCode.MemberNotFound }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<WorkspaceMemberDto>;
    };

export type ClerkProfileLookupResult =
  | { ok: true; profile: ClerkUserProfile }
  | {
      ok: false;
      code:
        | typeof WorkspaceMemberErrorCode.ClerkAccountNotFound
        | typeof WorkspaceMemberErrorCode.ClerkUnavailable;
    };

export type ClerkProfileListResult =
  | { ok: true; profiles: ClerkUserProfile[] }
  | { ok: false; code: typeof WorkspaceMemberErrorCode.ClerkUnavailable };
