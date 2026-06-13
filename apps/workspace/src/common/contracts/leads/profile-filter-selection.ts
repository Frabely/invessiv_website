import type { LeadProfileType } from "@/common/constants/leads/profile/lead-profile-types";

export type ProfileFilterSelection = {
  include: LeadProfileType[];
  exclude: LeadProfileType[];
};
