import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";

export type VersionedJsonMutationResult<TValue, TErrorCode extends string> =
  | { ok: true; value: TValue }
  | { ok: false; code: TErrorCode }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: TValue;
    };
