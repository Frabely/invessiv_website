import type { PitchAudience } from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import type { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";

export interface CreateLeadPitchDraftInput {
  leadId: string;
  channel: PitchChannel;
  audience: PitchAudience;
  salutationName: string;
  icebreaker: string;
  body: string;
  model: string | null;
  profileSource: ProfileSnapshotSource;
  profileCapturedAt: Date | null;
}
