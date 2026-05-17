import "server-only";
import type { GenerateOutreachRequestDto } from "@/common/ai-outreach-generation/generate-outreach-request.dto";
import type { GenerateOutreachResultDto } from "@/common/ai-outreach-generation/generate-outreach-result.dto";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { outreachPromptService } from "@/server/workspace/outreach/services/outreach-prompt-service";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";
import { outreachMessageParser } from "@/server/workspace/outreach/services/outreach-message-parser";
import { appendLeadActivity } from "@/server/workspace/leads/services/lead-activity-service";

export async function generateOutreachMessage(
  request: GenerateOutreachRequestDto,
): Promise<GenerateOutreachResultDto> {
  const lead = await getLeadById(request.leadId);
  if (!lead) {
    return { ok: false, code: OutreachErrorCode.LeadNotFound };
  }

  let rawText: string;
  if (request.clientGeneratedRawText) {
    rawText = request.clientGeneratedRawText;
  } else {
    const { systemPrompt, userPrompt } =
      outreachPromptService.buildPromptMessages(
        lead,
        request.promptKey,
        request.channel,
        {
          includeImprovements: request.includeImprovements,
          contextNote: request.contextNote,
        },
      );

    try {
      rawText = await outreachAiService.generate(systemPrompt, userPrompt);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === OutreachErrorCode.ProviderUnavailable
      ) {
        return { ok: false, code: OutreachErrorCode.ProviderUnavailable };
      }
      if (
        error instanceof Error &&
        error.message === OutreachErrorCode.NotConfigured
      ) {
        return { ok: false, code: OutreachErrorCode.NotConfigured };
      }
      return { ok: false, code: OutreachErrorCode.Internal };
    }
  }

  const parsed = outreachMessageParser.parse(request.channel, rawText);

  await appendLeadActivity({
    leadId: request.leadId,
    type: LeadActivityType.MessageDrafted,
    body: parsed.body,
    metadata: {
      promptKey: request.promptKey,
      channel: request.channel,
      ...(parsed.subject !== undefined ? { subject: parsed.subject } : {}),
    },
    actorType: LeadActorType.System,
  });

  return {
    ok: true,
    channel: request.channel,
    promptKey: request.promptKey,
    body: parsed.body,
    ...(parsed.subject !== undefined ? { subject: parsed.subject } : {}),
  };
}
