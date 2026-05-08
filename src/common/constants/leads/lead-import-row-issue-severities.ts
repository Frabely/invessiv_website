export const LeadImportRowIssueSeverity = {
  Error: "error",
  Warning: "warning",
  Skip: "skip",
} as const;

export type LeadImportRowIssueSeverity =
  (typeof LeadImportRowIssueSeverity)[keyof typeof LeadImportRowIssueSeverity];

export const LEAD_IMPORT_ROW_ISSUE_SEVERITY_VALUES = [
  LeadImportRowIssueSeverity.Error,
  LeadImportRowIssueSeverity.Warning,
  LeadImportRowIssueSeverity.Skip,
] as const;
