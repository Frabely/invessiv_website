import { PostgresErrorCode } from "@invessiv/db/core";
import { DuplicateEmailError } from "@/server/workspace/leads/shared/duplicate-email-error.class";
import { DuplicateCompanyNameError } from "@/server/workspace/leads/shared/duplicate-company-name-error.class";
import { DuplicateSocialProfileError } from "@/server/workspace/leads/shared/duplicate-social-profile-error.class";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

const LEADS_EMAIL_UNIQUE_CONSTRAINT = "leads_email_lower_uidx";
const LEADS_COMPANY_NAME_UNIQUE_CONSTRAINT = "leads_company_name_lower_uidx";
const LEADS_EXTERNAL_GUID_UNIQUE_CONSTRAINT = "leads_external_guid_uidx";
const LEAD_SOCIAL_PROFILES_UNIQUE_CONSTRAINT =
  "lead_social_profiles_platform_normalized_url_uidx";

function getUniqueConstraint(error: unknown): string | undefined {
  return postgresErrorService.getViolatedConstraint(
    error,
    PostgresErrorCode.UniqueViolation,
  );
}

export function isDuplicateEmailError(error: unknown): boolean {
  if (error instanceof DuplicateEmailError) {
    return true;
  }

  const constraint = getUniqueConstraint(error);
  if (constraint !== undefined) {
    return constraint === LEADS_EMAIL_UNIQUE_CONSTRAINT;
  }

  return postgresErrorService.isViolation(
    error,
    PostgresErrorCode.UniqueViolation,
  );
}

export function isDuplicateExternalGuidError(error: unknown): boolean {
  return getUniqueConstraint(error) === LEADS_EXTERNAL_GUID_UNIQUE_CONSTRAINT;
}

export function isDuplicateCompanyNameError(error: unknown): boolean {
  if (error instanceof DuplicateCompanyNameError) {
    return true;
  }

  const constraint = getUniqueConstraint(error);
  if (constraint !== undefined) {
    return constraint === LEADS_COMPANY_NAME_UNIQUE_CONSTRAINT;
  }

  return false;
}

export function isDuplicateSocialProfileError(error: unknown): boolean {
  if (error instanceof DuplicateSocialProfileError) {
    return true;
  }

  const constraint = getUniqueConstraint(error);
  if (constraint !== undefined) {
    return constraint === LEAD_SOCIAL_PROFILES_UNIQUE_CONSTRAINT;
  }

  return false;
}
