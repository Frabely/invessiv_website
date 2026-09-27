import { z } from "zod";
import { PendingMessageStatus } from "@invessiv/common/constants/ui/pending-message-statuses";
import { sendMessageInputSchema } from "@invessiv/common/contracts/crm/send-message.input";
import type { PendingThreadMessage } from "@invessiv/common/contracts/ui/pending-thread-message";

// A stored entry must still be sendable, so its body follows the send rules exactly.
const storedPendingMessageSchema = z.object({
  clientId: z.string().min(1),
  body: sendMessageInputSchema.shape.body,
  createdAt: z.iso.datetime(),
});

/**
 * Restores unsent messages read from local storage; malformed entries are dropped one by one.
 * A send interrupted by a reload comes back as failed, so it is only ever retried on purpose.
 */
export function parseStoredPendingMessages(
  stored: unknown,
): PendingThreadMessage[] {
  if (!Array.isArray(stored)) return [];
  return stored.flatMap((entry) => {
    const parsed = storedPendingMessageSchema.safeParse(entry);
    return parsed.success
      ? [{ ...parsed.data, status: PendingMessageStatus.Failed }]
      : [];
  });
}
