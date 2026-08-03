import "server-only";

import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import type { LeadPitchDraftDto } from "@invessiv/common/contracts/leads/outreach/lead-pitch-draft.dto";
import { leadPitchDraftService } from "@/server/workspace/outreach/services/lead-pitch-draft/lead-pitch-draft-service";

export async function getLatestLeadPitch(
  leadId: string,
  channel: PitchChannel,
): Promise<LeadPitchDraftDto | null> {
  return leadPitchDraftService.getLatestDraft(leadId, channel);
}
