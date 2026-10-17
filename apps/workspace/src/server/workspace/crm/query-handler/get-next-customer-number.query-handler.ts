import "server-only";

import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customerReadService } from "@/server/workspace/crm/services/customer-read-service";

/** Suggestion for the create and conversion dialogs; the unique index still decides on submit. */
export async function getNextCustomerNumber(): Promise<number | null> {
  return customerReadService.findLowestFreeCustomerNumber(
    getDrizzleDatabaseClient(),
  );
}
