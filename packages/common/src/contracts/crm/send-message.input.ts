import { z } from "zod";
import { MESSAGE_BODY_MAX_LENGTH } from "../../constants/crm/message-limits";

/** Payload for sending one trimmed text message. */
export const sendMessageInputSchema = z.object({
  /** Message content visible to both sides of the conversation. */
  body: z.string().trim().min(1).max(MESSAGE_BODY_MAX_LENGTH),
  /** Stable across retries so one intended send creates at most one message. */
  clientMessageId: z.uuid(),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;
