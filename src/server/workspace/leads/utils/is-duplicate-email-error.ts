import { PostgresErrorCode } from "@/server/db/core";
import { DuplicateEmailError } from "@/server/workspace/leads/services/create-lead-core/duplicate-email-error";

const DUPLICATE_ERROR_KEYS = [
  "cause",
  "originalError",
  "originalCause",
] as const;

export function isDuplicateEmailError(error: unknown): boolean {
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

    const isDuplicateDbError =
      "code" in current &&
      (current as { code?: unknown }).code ===
        PostgresErrorCode.UniqueViolation;

    if (current instanceof DuplicateEmailError || isDuplicateDbError) {
      return true;
    }

    for (const key of DUPLICATE_ERROR_KEYS) {
      if (key in current) {
        stack.push((current as Record<string, unknown>)[key]);
      }
    }
  }

  return false;
}
