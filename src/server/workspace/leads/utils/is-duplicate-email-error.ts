import { PostgresErrorCode } from "@/server/db/core";
import { DuplicateEmailError } from "@/server/workspace/leads/services/create-lead-core/duplicate-email-error";

const DUPLICATE_ERROR_KEYS = [
  "cause",
  "originalError",
  "originalCause",
] as const;

const LEADS_EMAIL_UNIQUE_CONSTRAINT = "leads_email_lower_uidx";
const LEADS_EXTERNAL_GUID_UNIQUE_CONSTRAINT = "leads_external_guid_uidx";

function getUniqueViolationConstraint(error: unknown): string | undefined {
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

    const isUniqueViolation =
      "code" in current &&
      (current as { code?: unknown }).code ===
        PostgresErrorCode.UniqueViolation;

    if (isUniqueViolation) {
      const constraint =
        "constraint" in current
          ? (current as { constraint?: unknown }).constraint
          : undefined;
      if (typeof constraint === "string") {
        return constraint;
      }
    }

    for (const key of DUPLICATE_ERROR_KEYS) {
      if (key in current) {
        stack.push((current as Record<string, unknown>)[key]);
      }
    }
  }

  return undefined;
}

function hasUniqueViolation(error: unknown): boolean {
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

    const isUniqueViolation =
      "code" in current &&
      (current as { code?: unknown }).code ===
        PostgresErrorCode.UniqueViolation;
    if (isUniqueViolation) {
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

export function isDuplicateEmailError(error: unknown): boolean {
  if (error instanceof DuplicateEmailError) {
    return true;
  }

  const constraint = getUniqueViolationConstraint(error);
  if (constraint !== undefined) {
    return constraint === LEADS_EMAIL_UNIQUE_CONSTRAINT;
  }

  return hasUniqueViolation(error);
}

export function isDuplicateExternalGuidError(error: unknown): boolean {
  const constraint = getUniqueViolationConstraint(error);
  return constraint === LEADS_EXTERNAL_GUID_UNIQUE_CONSTRAINT;
}
