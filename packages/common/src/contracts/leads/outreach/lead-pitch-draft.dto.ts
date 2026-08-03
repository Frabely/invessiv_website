import type { PitchAudience } from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import type { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";

export interface LeadPitchDraftDto {
  id: string;
  leadId: string;
  channel: PitchChannel;
  audience: PitchAudience;
  salutationName: string;
  icebreaker: string;
  body: string;
  charCount: number;
  model: string | null;
  profileSource: ProfileSnapshotSource;
  profileCapturedAt: string | null;
  createdAt: string;
}
