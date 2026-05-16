import type { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import type { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";

export interface SaveGeneratedMessageRequestDto {
  channel: OutreachChannel;
  leadId: string;
  promptKey: OutreachPromptKey;
  rawText: string;
}
