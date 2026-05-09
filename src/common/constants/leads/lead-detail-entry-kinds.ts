export const LeadDetailEntryKind = {
  Activity: "activity",
  Submission: "submission",
} as const;

export type LeadDetailEntryKind =
  (typeof LeadDetailEntryKind)[keyof typeof LeadDetailEntryKind];

export const LEAD_DETAIL_ENTRY_KIND_VALUES = [
  LeadDetailEntryKind.Activity,
  LeadDetailEntryKind.Submission,
] as const;
