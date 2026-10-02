import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";

/**
 * The rejection of a write against a stale version: the version that stands now and the aggregate
 * as it is, so the client keeps the user's input and shows the fresh state.
 */
export function versionConflict<TCurrent>(
  currentVersion: number,
  current: TCurrent,
): {
  ok: false;
  code: typeof ConcurrencyErrorCode.VersionConflict;
  conflict: VersionConflictDto<TCurrent>;
} {
  return {
    ok: false,
    code: ConcurrencyErrorCode.VersionConflict,
    conflict: {
      code: ConcurrencyErrorCode.VersionConflict,
      currentVersion,
      current,
    },
  };
}
