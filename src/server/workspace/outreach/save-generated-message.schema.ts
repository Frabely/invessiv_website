import { z } from "zod";
import { OUTREACH_CHANNEL_VALUES } from "@/common/ai-outreach-generation/outreach-channels";
import { OUTREACH_PROMPT_KEY_VALUES } from "@/common/ai-outreach-generation/outreach-prompt-keys";

export const saveGeneratedMessageSchema = z.object({
  leadId: z.string().min(1),
  promptKey: z.enum(OUTREACH_PROMPT_KEY_VALUES),
  channel: z.enum(OUTREACH_CHANNEL_VALUES),
  rawText: z.string().min(1),
});

export type SaveGeneratedMessageInput = z.infer<
  typeof saveGeneratedMessageSchema
>;
