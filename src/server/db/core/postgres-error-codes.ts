export const PostgresErrorCode = {
  ForeignKeyViolation: "23503",
  UniqueViolation: "23505",
} as const;

export type PostgresErrorCode =
  (typeof PostgresErrorCode)[keyof typeof PostgresErrorCode];
