import { z } from "zod";
import { MESSAGE_ATTACHMENTS_MAX } from "@invessiv/common/constants/crm/message-limits";
import { ASSET_KIND_VALUES } from "@invessiv/common/constants/files/asset-kind";
import { PendingMessageStatus } from "@invessiv/common/constants/ui/pending-message-statuses";
import { sendMessageInputSchema } from "@invessiv/common/contracts/crm/send-message.input";
import type { PendingThreadMessage } from "@invessiv/common/contracts/ui/pending-thread-message";

const storedAttachmentSchema = z.object({
  fileId: z.uuid(),
  displayName: z.string().min(1),
  assetKind: z.enum(ASSET_KIND_VALUES),
  releasesOnSend: z.boolean(),
});

// A stored entry must still be sendable, so its body and attachments follow the send rules.
const storedPendingMessageSchema = z
  .object({
    clientId: z.string().min(1),
    body: sendMessageInputSchema.shape.body,
    // Entries stored before chat attachments existed have none.
    attachments: z
      .array(storedAttachmentSchema)
      .max(MESSAGE_ATTACHMENTS_MAX)
      .default([]),
    createdAt: z.iso.datetime(),
  })
  .refine((entry) => entry.body.length > 0 || entry.attachments.length > 0);

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
