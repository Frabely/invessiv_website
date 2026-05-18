import { z } from "zod";
import { OUTREACH_CHANNEL_VALUES } from "@/common/ai-outreach-generation/outreach-channels";
import { OUTREACH_CONTEXT_NOTE_MAX_LEN } from "@/common/ai-outreach-generation/outreach-defaults";

export const generateOutreachMessageSchema = z.object({
  leadId: z.string().min(1),
  channel: z.enum(OUTREACH_CHANNEL_VALUES),
  contextNote: z.string().max(OUTREACH_CONTEXT_NOTE_MAX_LEN).optional(),
});
