import type { PostgresErrorCode } from "@invessiv/db/core";

export type PostgresViolation = {
  code: PostgresErrorCode;
  /** Missing when the driver does not report the constraint name. */
  constraint: string | undefined;
};
