/** Constraint and index names of `lead_social_profiles`, declared once for the model and the duplicate mapping. */
export const LeadSocialProfilesConstraintName = {
  PlatformCheck: "lead_social_profiles_platform_check",
  ProfileUrlCheck: "lead_social_profiles_profile_url_check",
  NormalizedUrlCheck: "lead_social_profiles_normalized_url_check",
  LeadIdIndex: "lead_social_profiles_lead_id_idx",
  PlatformNormalizedUrlUnique:
    "lead_social_profiles_platform_normalized_url_uidx",
} as const;

export type LeadSocialProfilesConstraintName =
  (typeof LeadSocialProfilesConstraintName)[keyof typeof LeadSocialProfilesConstraintName];

export const LEAD_SOCIAL_PROFILES_CONSTRAINT_NAME_VALUES = [
  LeadSocialProfilesConstraintName.PlatformCheck,
  LeadSocialProfilesConstraintName.ProfileUrlCheck,
  LeadSocialProfilesConstraintName.NormalizedUrlCheck,
  LeadSocialProfilesConstraintName.LeadIdIndex,
  LeadSocialProfilesConstraintName.PlatformNormalizedUrlUnique,
] as const;
