import { LeadSocialProfilesConstraintName } from "@invessiv/db/constraint-names/lead-social-profiles-constraint-names";
import { LeadsConstraintName } from "@invessiv/db/constraint-names/leads-constraint-names";
import { PostgresErrorCode } from "@invessiv/db/core";
import { DuplicateEmailError } from "@/server/workspace/leads/shared/duplicate-email-error.class";
import { DuplicateCompanyNameError } from "@/server/workspace/leads/shared/duplicate-company-name-error.class";
import { DuplicateSocialProfileError } from "@/server/workspace/leads/shared/duplicate-social-profile-error.class";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

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
    return constraint === LeadsConstraintName.EmailLowerUnique;
  }

  return postgresErrorService.isViolation(
    error,
    PostgresErrorCode.UniqueViolation,
  );
}

export function isDuplicateExternalGuidError(error: unknown): boolean {
  return getUniqueConstraint(error) === LeadsConstraintName.ExternalGuidUnique;
}

export function isDuplicateCompanyNameError(error: unknown): boolean {
  if (error instanceof DuplicateCompanyNameError) {
    return true;
  }

  const constraint = getUniqueConstraint(error);
  if (constraint !== undefined) {
    return constraint === LeadsConstraintName.CompanyNameLowerUnique;
  }

  return false;
}

export function isDuplicateSocialProfileError(error: unknown): boolean {
  if (error instanceof DuplicateSocialProfileError) {
    return true;
  }

  const constraint = getUniqueConstraint(error);
  if (constraint !== undefined) {
    return (
      constraint ===
      LeadSocialProfilesConstraintName.PlatformNormalizedUrlUnique
    );
  }

  return false;
}
