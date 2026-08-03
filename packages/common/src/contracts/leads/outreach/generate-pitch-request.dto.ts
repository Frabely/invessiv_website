import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import type { ProfileSnapshot } from "./profile-snapshot";

export interface GeneratePitchRequestDto {
  leadId: string;
  channel: PitchChannel;
  snapshot: ProfileSnapshot;
}
