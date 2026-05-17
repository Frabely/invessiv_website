import { z } from "zod";
import { OUTREACH_CHANNEL_VALUES } from "@/common/ai-outreach-generation/outreach-channels";
import { OUTREACH_CONTEXT_NOTE_MAX_LEN } from "@/common/ai-outreach-generation/outreach-defaults";
import { OUTREACH_PROMPT_KEY_VALUES } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { OUTREACH_PROVIDER_VALUES } from "@/common/constants/workspace/leads/ai-outreach-generation/outreach-provider";

export const generateOutreachMessageSchema = z.object({
  leadId: z.string().min(1),
  promptKey: z.enum(OUTREACH_PROMPT_KEY_VALUES),
  channel: z.enum(OUTREACH_CHANNEL_VALUES),
  includeImprovements: z.boolean(),
  contextNote: z.string().max(OUTREACH_CONTEXT_NOTE_MAX_LEN).optional(),
  clientGeneratedRawText: z.string().optional(),
  provider: z.enum(OUTREACH_PROVIDER_VALUES).optional(),
});

export type GenerateOutreachMessageInput = z.infer<
  typeof generateOutreachMessageSchema
>;
