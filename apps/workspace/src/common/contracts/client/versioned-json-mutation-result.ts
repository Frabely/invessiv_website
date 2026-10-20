import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";

export type VersionedJsonMutationResult<
  TValue,
  TErrorCode extends string,
  TCurrentErrorCode extends TErrorCode = never,
> =
  | { ok: true; value: TValue }
  | { ok: false; code: TErrorCode }
  | ([TCurrentErrorCode] extends [never]
      ? never
      : { ok: false; code: TCurrentErrorCode; current: TValue })
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: TValue;
    };
