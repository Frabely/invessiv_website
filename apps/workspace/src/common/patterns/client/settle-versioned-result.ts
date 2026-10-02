import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";
import type { VersionedMutationOutcome } from "@/common/contracts/client/versioned-mutation-outcome";

/** The one place that tells a conflict from a plain failure: only a conflict carries `current`. */
export function settleVersionedResult<TValue, TErrorCode extends string>(
  result: VersionedJsonMutationResult<TValue, TErrorCode>,
): VersionedMutationOutcome<TValue, TErrorCode> {
  if (result.ok)
    return { kind: VersionedMutationOutcomeKind.Saved, value: result.value };
  if ("current" in result)
    return {
      kind: VersionedMutationOutcomeKind.Conflict,
      current: result.current,
    };
  return { kind: VersionedMutationOutcomeKind.Failure, code: result.code };
}
