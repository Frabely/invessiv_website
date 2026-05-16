import type { OutreachChannel } from "./outreach-channels";
import type { OutreachLeadFacts } from "./outreach-lead-facts";
import type { OutreachPromptOptions } from "./outreach-prompt-options";

export interface PromptBuildContext {
  channel: OutreachChannel;
  lead: OutreachLeadFacts;
  options: OutreachPromptOptions;
}
