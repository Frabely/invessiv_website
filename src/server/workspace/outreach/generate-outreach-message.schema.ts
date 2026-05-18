import { z } from "zod";
import { OUTREACH_CHANNEL_VALUES } from "@/common/constants/leads/outreach/lead-outreach-channels";
import { OUTREACH_CONTEXT_NOTE_MAX_LEN } from "@/common/defaults/leads/outreach/lead-outreach-defaults";

export const generateOutreachMessageSchema = z.object({
  leadId: z.string().min(1),
  channel: z.enum(OUTREACH_CHANNEL_VALUES),
  contextNote: z.string().max(OUTREACH_CONTEXT_NOTE_MAX_LEN).optional(),
});
