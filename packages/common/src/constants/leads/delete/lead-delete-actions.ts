export const LeadDeleteAction = {
  Archive: "archive",
  Delete: "delete",
} as const;

export type LeadDeleteAction =
  (typeof LeadDeleteAction)[keyof typeof LeadDeleteAction];
