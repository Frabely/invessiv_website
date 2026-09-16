import "server-only";

import type { CrmOperation } from "@/common/constants/crm/crm-operations";
import { postgresErrorService } from "@/server/workspace/shared/services/postgres-error-service";

/**
 * Keeps unexpected failures observable without leaking them to the client. Request bodies,
 * customer names and contact data are never logged — only the operation and error shape.
 */
export function logCrmFailure(operation: CrmOperation, error: unknown): void {
  const violation = postgresErrorService.findViolation(error);
  console.error("[workspace-crm] request failed", {
    operation,
    errorName: error instanceof Error ? error.name : typeof error,
    postgresCode: violation?.code ?? null,
    constraint: violation?.constraint ?? null,
  });
}
