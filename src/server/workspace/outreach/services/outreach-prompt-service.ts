import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";
import type { OutreachChannel } from "@/common/ai-outreach-generation/outreach-channels";
import type { OutreachPromptKey } from "@/common/ai-outreach-generation/outreach-prompt-keys";
import type { OutreachPromptOptions } from "@/common/ai-outreach-generation/outreach-prompt-options";
import type { OutreachPromptMessages } from "@/common/ai-outreach-generation/outreach-prompt-messages";
import { sanitizeLeadFacts } from "@/common/ai-outreach-generation/outreach-lead-facts";
import { OUTREACH_PROMPT_REGISTRY } from "@/common/ai-outreach-generation/outreach-prompt-registry";

function buildPromptMessages(
  lead: LeadDetailDto,
  promptKey: OutreachPromptKey,
  channel: OutreachChannel,
  options: OutreachPromptOptions,
): OutreachPromptMessages {
  const leadFacts = sanitizeLeadFacts(lead);
  const entry = OUTREACH_PROMPT_REGISTRY[promptKey];
  return entry.build({ channel, lead: leadFacts, options });
}

export const outreachPromptService = {
  sanitizeLeadFacts,
  buildPromptMessages,
};
