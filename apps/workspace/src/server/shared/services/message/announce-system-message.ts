import "server-only";

import type { SystemMessageKey } from "@invessiv/common/constants/crm/system-message-keys";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { messageService } from "./message-service";

/**
 * A chat notice must never undo the write it announces: it runs in a savepoint, and a failure only
 * rolls back the notice and is logged by name, without customer text.
 */
export async function announceSystemMessage(
  tx: ContactDatabaseTransaction,
  customerId: string,
  key: SystemMessageKey,
  params: Record<string, string>,
): Promise<void> {
  try {
    await tx.transaction((savepoint) =>
      messageService.appendSystemMessage(savepoint, customerId, key, params),
    );
  } catch (error) {
    console.error("[system-message] announcement failed", {
      key,
      errorName: error instanceof Error ? error.name : typeof error,
    });
  }
}
