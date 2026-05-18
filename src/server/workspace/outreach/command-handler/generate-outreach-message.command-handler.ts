import "server-only";
import type { GenerateOutreachRequestDto } from "@/common/contracts/leads/outreach/generate-outreach-request.dto";
import type { GenerateOutreachResultDto } from "@/common/contracts/leads/outreach/generate-outreach-result.dto";
import { OutreachErrorCode } from "@/common/constants/leads/outreach/lead-outreach-error-codes";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";
import { outreachSkillContextService } from "@/server/workspace/outreach/services/outreach-skill-context-service";
import { outreachMessageParser } from "@/server/workspace/outreach/services/outreach-message-parser";
import { leadActivityService } from "@/server/workspace/leads/services/lead-activity-service";

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
    const generated = await outreachAiService.generate(
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

  await leadActivityService.appendLeadActivity({
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
