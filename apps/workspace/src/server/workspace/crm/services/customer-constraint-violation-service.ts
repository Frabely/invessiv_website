import { PostgresErrorCode } from "@invessiv/db/core";
import { CustomersConstraintName } from "@invessiv/db/constraint-names/crm/customers-constraint-names";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

function isDisplayNameTaken(error: unknown): boolean {
  return (
    postgresErrorService.getViolatedConstraint(
      error,
      PostgresErrorCode.UniqueViolation,
    ) === CustomersConstraintName.DisplayNameLowerUnique
  );
}

export const customerConstraintViolationService = {
  isDisplayNameTaken,
} as const;
