"use client";

import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import type { GeneratePitchRequestDto } from "@invessiv/common/contracts/leads/outreach/generate-pitch-request.dto";
import type { GeneratePitchResultDto } from "@invessiv/common/contracts/leads/outreach/generate-pitch-result.dto";
import type { LeadPitchDraftDto } from "@invessiv/common/contracts/leads/outreach/lead-pitch-draft.dto";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";

function readErrorCode(payload: unknown): LeadPitchErrorCode {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string" &&
    Object.values(LeadPitchErrorCode).some(
      (code) => code === (payload as { error: string }).error,
    )
  ) {
    return (payload as { error: LeadPitchErrorCode }).error;
  }

  return LeadPitchErrorCode.Internal;
}

async function generatePitch(
  request: GeneratePitchRequestDto,
): Promise<GeneratePitchResultDto> {
  let response: Response;
  try {
    response = await fetch(WorkspaceApiEndpoint.OutreachPitch, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    return { ok: false, code: LeadPitchErrorCode.Internal };
  }

  const payload = await response.json().catch(() => null);

  if (response.ok && payload && (payload as { ok?: unknown }).ok === true) {
    return payload as GeneratePitchResultDto;
  }

  return { ok: false, code: readErrorCode(payload) };
}

async function getLatestPitch(
  leadId: string,
  channel: PitchChannel,
): Promise<LeadPitchDraftDto | null> {
  const query = new URLSearchParams({ leadId, channel });

  try {
    const response = await fetch(
      `${WorkspaceApiEndpoint.OutreachPitch}?${query.toString()}`,
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      draft?: LeadPitchDraftDto | null;
    };

    return payload.draft ?? null;
  } catch {
    return null;
  }
}

export const leadPitchClientService = {
  generatePitch,
  getLatestPitch,
} as const;
