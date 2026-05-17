import type { OutreachChannel } from "./outreach-channels";
import type { OutreachProvider } from "@/common/constants/workspace/leads/ai-outreach-generation/outreach-provider";
import type { OutreachPromptKey } from "./outreach-prompt-keys";

export interface GenerateOutreachRequestDto {
  leadId: string;
  promptKey: OutreachPromptKey;
  channel: OutreachChannel;
  includeImprovements: boolean;
  contextNote?: string;
  clientGeneratedRawText?: string;
  provider?: OutreachProvider;
}
