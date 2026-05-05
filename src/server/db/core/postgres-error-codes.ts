export const PostgresErrorCode = {
  UniqueViolation: "23505",
} as const;

export type PostgresErrorCode =
  (typeof PostgresErrorCode)[keyof typeof PostgresErrorCode];
