export const LeadValidationMessageCode = {
  CategoryInvalid: "category_invalid",
  EmailInvalid: "email_invalid",
  EmailRequired: "email_required",
  ImprovementRequired: "improvement_required",
  ScoreInvalid: "score_invalid",
  SocialProfileRequired: "social_profile_required",
  UrlInvalid: "url_invalid",
} as const;

export type LeadValidationMessageCode =
  (typeof LeadValidationMessageCode)[keyof typeof LeadValidationMessageCode];

export const LeadZodIssueCode = {
  Custom: "custom",
} as const;

export type LeadZodIssueCode =
  (typeof LeadZodIssueCode)[keyof typeof LeadZodIssueCode];

export const LeadAddLeadFormFieldPath = {
  CategoryId: () => ["category_id"],
  CompanyName: () => ["company_name"],
  Email: () => ["email"],
  LastName: () => ["last_name"],
  Score: () => ["score"],
  SocialProfilePlatform: (index: number) => [
    "social_profiles",
    index,
    "platform",
  ],
  SocialProfileProfileUrl: (index: number) => [
    "social_profiles",
    index,
    "profile_url",
  ],
  WebsiteUrl: () => ["website_url"],
} as const;
