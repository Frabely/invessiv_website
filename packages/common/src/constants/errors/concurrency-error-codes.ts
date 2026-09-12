export const ConcurrencyErrorCode = {
  VersionConflict: "version_conflict",
  NotFound: "not_found",
} as const;

export type ConcurrencyErrorCode =
  (typeof ConcurrencyErrorCode)[keyof typeof ConcurrencyErrorCode];

export const CONCURRENCY_ERROR_CODE_VALUES = [
  ConcurrencyErrorCode.VersionConflict,
  ConcurrencyErrorCode.NotFound,
] as const;
