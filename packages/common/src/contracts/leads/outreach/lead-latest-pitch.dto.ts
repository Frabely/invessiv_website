import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";

export interface LeadLatestPitchDto {
  channel: PitchChannel;
  charCount: number;
  createdAt: string;
}
