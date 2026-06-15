export const LeadFilterSelectId = {
  Score: "leads-score-filter",
  Status: "leads-mobile-status-filter",
  Category: "leads-mobile-category-filter",
  Source: "leads-mobile-source-filter",
  Profile: "leads-mobile-profile-filter",
} as const;

export type LeadFilterSelectId =
  (typeof LeadFilterSelectId)[keyof typeof LeadFilterSelectId];
