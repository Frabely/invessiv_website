import { PostgresErrorCode } from "@invessiv/db/core";
import type { PostgresViolation } from "@/server/workspace/shared/postgres-error-types";

// Drivers and Drizzle wrap the Postgres error under different keys.
const WRAPPED_ERROR_KEYS = ["cause", "originalError", "originalCause"] as const;

// Only these codes name a violated constraint; other known codes such as a lock timeout are no violation.
const VIOLATION_CODES: readonly PostgresErrorCode[] = [
  PostgresErrorCode.ForeignKeyViolation,
  PostgresErrorCode.UniqueViolation,
  PostgresErrorCode.CheckViolation,
];

function isKnownCode(value: unknown): value is PostgresErrorCode {
  return VIOLATION_CODES.some((code) => code === value);
}

/** The first constraint violation in the error chain, or undefined for any other failure. */
function findViolation(error: unknown): PostgresViolation | undefined {
  const visited = new WeakSet<object>();
  const stack: unknown[] = [error];

  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current !== "object" || current === null) {
      continue;
    }
    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const code = (current as { code?: unknown }).code;
    if (isKnownCode(code)) {
      const constraint = (current as { constraint?: unknown }).constraint;
      return {
        code,
        constraint: typeof constraint === "string" ? constraint : undefined,
      };
    }

    for (const key of WRAPPED_ERROR_KEYS) {
      if (key in current) {
        stack.push((current as Record<string, unknown>)[key]);
      }
    }
  }

  return undefined;
}

function isViolation(error: unknown, code: PostgresErrorCode): boolean {
  return findViolation(error)?.code === code;
}

/** Name of the violated constraint when the error is a violation of the given kind. */
function getViolatedConstraint(
  error: unknown,
  code: PostgresErrorCode,
): string | undefined {
  const violation = findViolation(error);
  return violation?.code === code ? violation.constraint : undefined;
}

export const postgresErrorService = {
  findViolation,
  getViolatedConstraint,
  isViolation,
} as const;
