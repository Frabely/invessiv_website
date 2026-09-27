import { z } from "zod";

/** Payload for assigning a conversation to an internal member. */
export const updateConversationOwnerInputSchema = z.object({
  /** Active member who can read this customer's conversation. */
  ownerMemberId: z.uuid(),
  /** Current conversation version for optimistic locking. */
  version: z.number().int().positive(),
});

export type UpdateConversationOwnerInput = z.infer<
  typeof updateConversationOwnerInputSchema
>;
