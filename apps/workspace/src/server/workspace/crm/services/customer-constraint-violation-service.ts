import { PostgresErrorCode } from "@invessiv/db/core";
import { CustomersConstraintName } from "@invessiv/db/constraint-names/crm/customers-constraint-names";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

function violatedUniqueConstraint(error: unknown) {
  return postgresErrorService.getViolatedConstraint(
    error,
    PostgresErrorCode.UniqueViolation,
  );
}

function isDisplayNameTaken(error: unknown): boolean {
  return (
    violatedUniqueConstraint(error) ===
    CustomersConstraintName.DisplayNameLowerUnique
  );
}

function isCustomerNumberTaken(error: unknown): boolean {
  return (
    violatedUniqueConstraint(error) ===
    CustomersConstraintName.CustomerNumberUnique
  );
}

export const customerConstraintViolationService = {
  isCustomerNumberTaken,
  isDisplayNameTaken,
} as const;
