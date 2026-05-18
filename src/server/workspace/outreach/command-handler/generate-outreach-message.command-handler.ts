import "server-only";
import type { GenerateOutreachRequestDto } from "@/common/ai-outreach-generation/generate-outreach-request.dto";
import type { GenerateOutreachResultDto } from "@/common/ai-outreach-generation/generate-outreach-result.dto";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { outreachGenerationService } from "@/server/workspace/outreach/services/outreach-generation-service";
import { outreachSkillContextService } from "@/server/workspace/outreach/services/outreach-skill-context-service";
import { outreachMessageParser } from "@/server/workspace/outreach/services/outreach-message-parser";
import { appendLeadActivity } from "@/server/workspace/leads/services/lead-activity-service";

export async function generateOutreachMessage(
  request: GenerateOutreachRequestDto,
): Promise<GenerateOutreachResultDto> {
  const lead = await getLeadById(request.leadId);
  if (!lead) {
    return { ok: false, code: OutreachErrorCode.LeadNotFound };
  }

  const { systemPrompt, userPrompt } =
    await outreachSkillContextService.buildSkillPrompts({
      lead,
      channel: request.channel,
      contextNote: request.contextNote,
    });

  let rawText: string;
  try {
    const generated = await outreachGenerationService.generate(
      systemPrompt,
      userPrompt,
    );

    if (!generated) {
      return process.env.OPENAI_API_KEY
        ? { ok: false, code: OutreachErrorCode.ProviderUnavailable }
        : { ok: false, code: OutreachErrorCode.NotConfigured };
    }

    rawText = generated;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === OutreachErrorCode.ProviderUnavailable
    ) {
      return { ok: false, code: OutreachErrorCode.ProviderUnavailable };
    }

    return { ok: false, code: OutreachErrorCode.Internal };
  }

  const parsed = outreachMessageParser.parse(request.channel, rawText);

  await appendLeadActivity({
    leadId: request.leadId,
    type: LeadActivityType.MessageDrafted,
    body: parsed.body,
    metadata: {
      channel: request.channel,
      ...(parsed.subject !== undefined ? { subject: parsed.subject } : {}),
    },
    actorType: LeadActorType.System,
  });

  return {
    ok: true,
    channel: request.channel,
    body: parsed.body,
    ...(parsed.subject !== undefined ? { subject: parsed.subject } : {}),
  };
}
