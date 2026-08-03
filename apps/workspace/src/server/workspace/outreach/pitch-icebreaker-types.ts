import type { PitchAudience } from "@invessiv/common/constants/leads/outreach/lead-pitch-audiences";
import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";
import type { ProfileSnapshot } from "@invessiv/common/contracts/leads/outreach/profile-snapshot";

export interface PitchIcebreakerInput {
  lead: LeadDetailDto;
  channel: PitchChannel;
  snapshot: ProfileSnapshot;
  icebreakerBudget: number;
  usedIcebreakers: string[];
}

export interface PitchIcebreakerResult {
  salutationName: string;
  audience: PitchAudience;
  icebreaker: string;
  model: string;
}
