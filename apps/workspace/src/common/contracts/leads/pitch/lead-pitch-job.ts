import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import type { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import type { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import type { LeadPitchDraftDto } from "@invessiv/common/contracts/leads/outreach/lead-pitch-draft.dto";
import type { LeadPitchJobState } from "@/common/constants/leads/pitch/lead-pitch-job-states";

export type LeadPitchJobErrorCode = ProfileBridgeErrorCode | LeadPitchErrorCode;

export interface LeadPitchTarget {
  leadId: string;
  channel: PitchChannel;
  handle: string | null;
  profileUrl: string | null;
}

export interface LeadPitchJob {
  state: LeadPitchJobState;
  draft: LeadPitchDraftDto | null;
  body: string;
  errorCode: LeadPitchJobErrorCode | null;
}
