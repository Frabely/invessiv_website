import "server-only";

import { and, desc, eq } from "drizzle-orm";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { leadOutreachDrafts } from "@invessiv/db/record-configuration";
import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import type { LeadPitchDraftDto } from "@invessiv/common/contracts/leads/outreach/lead-pitch-draft.dto";
import { PITCH_ICEBREAKER_HISTORY_LIMIT } from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";
import type { CreateLeadPitchDraftInput } from "@/server/workspace/outreach/lead-pitch-draft-types";
import { mapLeadPitchDraftRowToDto } from "./lead-pitch-draft-mapping-service";

async function createDraft(
  tx: ContactDatabaseTransaction,
  input: CreateLeadPitchDraftInput,
): Promise<LeadPitchDraftDto> {
  const [row] = await tx
    .insert(leadOutreachDrafts)
    .values({
      id: crypto.randomUUID(),
      lead_id: input.leadId,
      channel: input.channel,
      audience: input.audience,
      salutation_name: input.salutationName,
      icebreaker: input.icebreaker,
      body: input.body,
      char_count: input.body.length,
      model: input.model,
      profile_source: input.profileSource,
      profile_captured_at: input.profileCapturedAt,
      created_at: new Date(),
    })
    .returning();

  return mapLeadPitchDraftRowToDto(row);
}

async function getLatestDraft(
  leadId: string,
  channel: PitchChannel,
): Promise<LeadPitchDraftDto | null> {
  const db = getDrizzleDatabaseClient();
  const rows = await db
    .select()
    .from(leadOutreachDrafts)
    .where(
      and(
        eq(leadOutreachDrafts.lead_id, leadId),
        eq(leadOutreachDrafts.channel, channel),
      ),
    )
    .orderBy(desc(leadOutreachDrafts.created_at))
    .limit(1);

  return rows.length > 0 ? mapLeadPitchDraftRowToDto(rows[0]) : null;
}

async function listRecentIcebreakers(
  leadId: string,
  channel: PitchChannel,
): Promise<string[]> {
  const db = getDrizzleDatabaseClient();
  const rows = await db
    .select({ icebreaker: leadOutreachDrafts.icebreaker })
    .from(leadOutreachDrafts)
    .where(
      and(
        eq(leadOutreachDrafts.lead_id, leadId),
        eq(leadOutreachDrafts.channel, channel),
      ),
    )
    .orderBy(desc(leadOutreachDrafts.created_at))
    .limit(PITCH_ICEBREAKER_HISTORY_LIMIT);

  return rows.map((row) => row.icebreaker);
}

export const leadPitchDraftService = {
  createDraft,
  getLatestDraft,
  listRecentIcebreakers,
} as const;
