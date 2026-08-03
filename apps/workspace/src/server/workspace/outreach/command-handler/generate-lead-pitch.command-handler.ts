import "server-only";

import { LeadActivityType } from "@invessiv/common/constants/leads/activity/lead-activity-types";
import { LeadActorType } from "@invessiv/common/constants/leads/activity/lead-actor-types";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import type { GeneratePitchRequestDto } from "@invessiv/common/contracts/leads/outreach/generate-pitch-request.dto";
import type { GeneratePitchResultDto } from "@invessiv/common/contracts/leads/outreach/generate-pitch-result.dto";
import { PITCH_ICEBREAKER_MAX_ATTEMPTS } from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  hasProfileSubstance,
  sanitizeProfileSnapshot,
} from "@invessiv/common/patterns/leads/outreach/sanitize-profile-snapshot";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { leadActivityService } from "@/server/workspace/leads/services/lead-activity-service";
import { leadPitchDraftService } from "@/server/workspace/outreach/services/lead-pitch-draft/lead-pitch-draft-service";
import { pitchIcebreakerService } from "@/server/workspace/outreach/services/pitch-icebreaker-service";
import { pitchTemplateService } from "@/server/workspace/outreach/services/pitch-template-service";

function toCapturedAt(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function readPitchErrorCode(error: unknown): LeadPitchErrorCode | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const code = Object.values(LeadPitchErrorCode).find(
    (value) => value === error.message,
  );

  return code ?? null;
}

export async function generateLeadPitch(
  request: GeneratePitchRequestDto,
): Promise<GeneratePitchResultDto> {
  const lead = await getLeadById(request.leadId);
  if (!lead) {
    return { ok: false, code: LeadPitchErrorCode.LeadNotFound };
  }

  const snapshot = sanitizeProfileSnapshot(request.snapshot);
  if (!hasProfileSubstance(snapshot)) {
    return { ok: false, code: LeadPitchErrorCode.NoProfileData };
  }

  const charLimit = pitchTemplateService.getCharLimit(request.channel);
  const usedIcebreakers = await leadPitchDraftService.listRecentIcebreakers(
    request.leadId,
    request.channel,
  );

  let budget = await pitchTemplateService.getInitialIcebreakerBudget(
    request.channel,
  );
  const rejectedIcebreakers: string[] = [];

  for (let attempt = 0; attempt < PITCH_ICEBREAKER_MAX_ATTEMPTS; attempt += 1) {
    let generated;
    try {
      generated = await pitchIcebreakerService.generate({
        lead,
        channel: request.channel,
        snapshot,
        icebreakerBudget: budget,
        usedIcebreakers: [...usedIcebreakers, ...rejectedIcebreakers],
      });
    } catch (error) {
      const code = readPitchErrorCode(error);
      if (code) {
        return { ok: false, code };
      }

      throw error;
    }

    if (!generated) {
      return process.env.OPENAI_API_KEY
        ? { ok: false, code: LeadPitchErrorCode.Internal }
        : { ok: false, code: LeadPitchErrorCode.NotConfigured };
    }

    if (
      generated.icebreaker.length === 0 ||
      generated.salutationName.length === 0
    ) {
      return { ok: false, code: LeadPitchErrorCode.NoProfileData };
    }

    const body = await pitchTemplateService.render({
      channel: request.channel,
      audience: generated.audience,
      salutationName: generated.salutationName,
      icebreaker: generated.icebreaker,
    });

    if (body.length <= charLimit) {
      const db = getDrizzleDatabaseClient();
      const draft = await db.transaction(async (tx) => {
        const storedDraft = await leadPitchDraftService.createDraft(tx, {
          leadId: request.leadId,
          channel: request.channel,
          audience: generated.audience,
          salutationName: generated.salutationName,
          icebreaker: generated.icebreaker,
          body,
          model: generated.model,
          profileSource: snapshot.source,
          profileCapturedAt: toCapturedAt(snapshot.capturedAt),
        });

        await leadActivityService.createLeadActivity(tx, {
          leadId: request.leadId,
          type: LeadActivityType.MessageDrafted,
          metadata: {
            draft_id: storedDraft.id,
            channel: request.channel,
            audience: storedDraft.audience,
          },
          actorType: LeadActorType.System,
        });

        return storedDraft;
      });

      return { ok: true, draft };
    }

    rejectedIcebreakers.push(generated.icebreaker);
    budget = await pitchTemplateService.getIcebreakerBudget({
      channel: request.channel,
      audience: generated.audience,
      salutationName: generated.salutationName,
    });
  }

  return { ok: false, code: LeadPitchErrorCode.IcebreakerTooLong };
}
