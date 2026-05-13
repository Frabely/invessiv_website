export const LeadValidationMessageCode = {
  CategoryInvalid: "category_invalid",
  DisplayNameRequired: "display_name_required",
  EmailInvalid: "email_invalid",
  ImprovementRequired: "improvement_required",
  PhoneInvalid: "phone_invalid",
  ScoreInvalid: "score_invalid",
  SocialProfileInvalid: "social_profile_invalid",
  SocialProfileRequired: "social_profile_required",
  UrlInvalid: "url_invalid",
} as const;

export type LeadValidationMessageCode =
  (typeof LeadValidationMessageCode)[keyof typeof LeadValidationMessageCode];

export const LEAD_VALIDATION_MESSAGE_CODE_VALUES = [
  LeadValidationMessageCode.CategoryInvalid,
  LeadValidationMessageCode.DisplayNameRequired,
  LeadValidationMessageCode.EmailInvalid,
  LeadValidationMessageCode.ImprovementRequired,
  LeadValidationMessageCode.PhoneInvalid,
  LeadValidationMessageCode.ScoreInvalid,
  LeadValidationMessageCode.SocialProfileInvalid,
  LeadValidationMessageCode.SocialProfileRequired,
  LeadValidationMessageCode.UrlInvalid,
] as const;

export const LeadZodIssueCode = {
  Custom: "custom",
} as const;

export type LeadZodIssueCode =
  (typeof LeadZodIssueCode)[keyof typeof LeadZodIssueCode];

export const LeadAddLeadFormFieldPath = {
  CategoryId: () => ["category_id"],
  CompanyName: () => ["company_name"],
  DisplayName: () => ["displayName"],
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
