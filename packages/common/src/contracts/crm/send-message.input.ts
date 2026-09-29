import { z } from "zod";
import {
  MESSAGE_ATTACHMENTS_MAX,
  MESSAGE_BODY_MAX_LENGTH,
} from "../../constants/crm/message-limits";

/** Payload for sending one message: trimmed text, attachments, or both. */
export const sendMessageInputSchema = z
  .object({
    /** Message content visible to both sides; empty only when files are attached. */
    body: z.string().trim().max(MESSAGE_BODY_MAX_LENGTH),
    /** Stable across retries so one intended send creates at most one message. */
    clientMessageId: z.uuid(),
    /** Existing file or link entries of the same customer, in display order. */
    attachmentFileIds: z
      .array(z.uuid().transform((id) => id.toLowerCase()))
      .max(MESSAGE_ATTACHMENTS_MAX)
      .refine((ids) => new Set(ids).size === ids.length)
      .default([]),
    /**
     * The sender saw that internal entries become visible to the customer. Only the CRM sends
     * true; without it an internal attachment is refused instead of released.
     */
    releaseHiddenAttachments: z.boolean().default(false),
  })
  .refine(
    (input) => input.body.length > 0 || input.attachmentFileIds.length > 0,
  );

/** Request shape; attachment fields are optional, so a plain text send stays `{ body, clientMessageId }`. */
export type SendMessageInput = z.input<typeof sendMessageInputSchema>;

/** Validated payload the send handlers work with: ids normalized, defaults applied. */
export type SendMessageData = z.output<typeof sendMessageInputSchema>;
