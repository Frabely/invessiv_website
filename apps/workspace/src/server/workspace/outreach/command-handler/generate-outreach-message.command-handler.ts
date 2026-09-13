import "server-only";
import type { GenerateOutreachRequestDto } from "@invessiv/common/contracts/leads/outreach/generate-outreach-request.dto";
import type { GenerateOutreachResultDto } from "@invessiv/common/contracts/leads/outreach/generate-outreach-result.dto";
import { OutreachErrorCode } from "@invessiv/common/constants/leads/outreach/lead-outreach-error-codes";
import { ActivityType } from "@invessiv/common/constants/activity/activity-types";
import { ActorType } from "@invessiv/common/constants/activity/actor-types";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { outreachAiService } from "@/server/workspace/outreach/services/outreach-ai-service";
import { outreachSkillContextService } from "@/server/workspace/outreach/services/outreach-skill-context-service";
import { outreachMessageParser } from "@/server/workspace/outreach/services/outreach-message-parser";
import { activityService } from "@/server/workspace/shared/services/activity-service";

export async function generateOutreachMessage(
  request: GenerateOutreachRequestDto,
  actorUserId: string,
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

  await activityService.appendActivity({
    leadId: request.leadId,
    type: ActivityType.MessageDrafted,
    body: parsed.body,
    metadata: {
      channel: request.channel,
      ...(parsed.subject !== undefined ? { subject: parsed.subject } : {}),
    },
    actor: { type: ActorType.User, userId: actorUserId },
  });

  return {
    ok: true,
    channel: request.channel,
    body: parsed.body,
    ...(parsed.subject !== undefined ? { subject: parsed.subject } : {}),
  };
}
