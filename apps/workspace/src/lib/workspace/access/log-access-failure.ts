import "server-only";

import type { AccessOperation } from "@/common/constants/access/access-operations";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

/**
 * Keeps unexpected failures observable without leaking them to the client. The constraint name
 * tells a catalog mismatch from a data problem; request bodies, names and emails are never logged.
 */
export function logAccessFailure(
  operation: AccessOperation,
  error: unknown,
): void {
  const violation = postgresErrorService.findViolation(error);
  console.error("[workspace-access] request failed", {
    operation,
    errorName: error instanceof Error ? error.name : typeof error,
    postgresCode: violation?.code ?? null,
    constraint: violation?.constraint ?? null,
  });
}
