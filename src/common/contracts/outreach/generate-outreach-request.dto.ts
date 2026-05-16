import type { OutreachChannel } from "@/common/constants/outreach/outreach-channels";
import type { OutreachPromptKey } from "@/common/constants/outreach/outreach-prompt-keys";

export interface GenerateOutreachRequestDto {
  leadId: string;
  promptKey: OutreachPromptKey;
  channel: OutreachChannel;
  includeImprovements: boolean;
  contextNote?: string;
}
