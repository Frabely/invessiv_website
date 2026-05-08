import { PostgresErrorCode } from "@/server/db/core";

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

    if (
      "code" in current &&
      (current as { code?: unknown }).code === PostgresErrorCode.UniqueViolation
    ) {
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
