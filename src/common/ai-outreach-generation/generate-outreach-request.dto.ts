import type { OutreachChannel } from "./outreach-channels";
import type { OutreachPromptKey } from "./outreach-prompt-keys";

export type OutreachProvider = "local-lm-studio" | "openai";

export interface GenerateOutreachRequestDto {
  leadId: string;
  promptKey: OutreachPromptKey;
  channel: OutreachChannel;
  includeImprovements: boolean;
  contextNote?: string;
  clientGeneratedRawText?: string;
  provider?: OutreachProvider;
}
