import { PostgresErrorCode } from "@invessiv/db/core";
import { DuplicateEmailError } from "@/server/workspace/leads/shared/duplicate-email-error.class";
import { DuplicateCompanyNameError } from "@/server/workspace/leads/shared/duplicate-company-name-error.class";
import { DuplicateSocialProfileError } from "@/server/workspace/leads/shared/duplicate-social-profile-error.class";

const DUPLICATE_ERROR_KEYS = [
  "cause",
  "originalError",
  "originalCause",
] as const;

const LEADS_EMAIL_UNIQUE_CONSTRAINT = "leads_email_lower_uidx";
const LEADS_COMPANY_NAME_UNIQUE_CONSTRAINT = "leads_company_name_lower_uidx";
const LEADS_EXTERNAL_GUID_UNIQUE_CONSTRAINT = "leads_external_guid_uidx";
const LEAD_SOCIAL_PROFILES_UNIQUE_CONSTRAINT =
  "lead_social_profiles_platform_normalized_url_uidx";

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

export function isDuplicateCompanyNameError(error: unknown): boolean {
  if (error instanceof DuplicateCompanyNameError) {
    return true;
  }

  const constraint = getUniqueViolationConstraint(error);
  if (constraint !== undefined) {
    return constraint === LEADS_COMPANY_NAME_UNIQUE_CONSTRAINT;
  }

  return false;
}

export function isDuplicateSocialProfileError(error: unknown): boolean {
  if (error instanceof DuplicateSocialProfileError) {
    return true;
  }

  const constraint = getUniqueViolationConstraint(error);
  if (constraint !== undefined) {
    return constraint === LEAD_SOCIAL_PROFILES_UNIQUE_CONSTRAINT;
  }

  return false;
}
