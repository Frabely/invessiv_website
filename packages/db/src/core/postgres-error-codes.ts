export const PostgresErrorCode = {
  ForeignKeyViolation: "23503",
  UniqueViolation: "23505",
  CheckViolation: "23514",
  LockNotAvailable: "55P03",
} as const;

export type PostgresErrorCode =
  (typeof PostgresErrorCode)[keyof typeof PostgresErrorCode];
