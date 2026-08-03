import "server-only";

import type { leadOutreachDrafts } from "@invessiv/db/record-configuration";
import type { LeadPitchDraftDto } from "@invessiv/common/contracts/leads/outreach/lead-pitch-draft.dto";

type LeadPitchDraftRow = typeof leadOutreachDrafts.$inferSelect;

export function mapLeadPitchDraftRowToDto(
  row: LeadPitchDraftRow,
): LeadPitchDraftDto {
  return {
    id: row.id,
    leadId: row.lead_id,
    channel: row.channel,
    audience: row.audience,
    salutationName: row.salutation_name,
    icebreaker: row.icebreaker,
    body: row.body,
    charCount: row.char_count,
    model: row.model,
    profileSource: row.profile_source,
    profileCapturedAt: row.profile_captured_at
      ? row.profile_captured_at.toISOString()
      : null,
    createdAt: row.created_at.toISOString(),
  };
}
