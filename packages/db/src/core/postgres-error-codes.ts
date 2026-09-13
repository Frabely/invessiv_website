export const PostgresErrorCode = {
  ForeignKeyViolation: "23503",
  UniqueViolation: "23505",
  CheckViolation: "23514",
} as const;

export type PostgresErrorCode =
  (typeof PostgresErrorCode)[keyof typeof PostgresErrorCode];

export const POSTGRES_ERROR_CODE_VALUES = [
  PostgresErrorCode.ForeignKeyViolation,
  PostgresErrorCode.UniqueViolation,
  PostgresErrorCode.CheckViolation,
] as const;
