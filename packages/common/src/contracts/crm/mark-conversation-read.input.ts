import { z } from "zod";

export const markConversationReadInputSchema = z.object({
  /** Latest visible text message from the other side, never the request time. */
  lastSeenMessageId: z.uuid(),
});

export type MarkConversationReadInput = z.infer<
  typeof markConversationReadInputSchema
>;
