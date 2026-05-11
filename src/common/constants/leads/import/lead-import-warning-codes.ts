export const LeadImportWarningCode = {
  IgnoredColumn: "ignored_column",
  UnknownStatusFallback: "unknown_status_fallback",
  EmptyImprovementToken: "empty_improvement_token",
} as const;

export type LeadImportWarningCode =
  (typeof LeadImportWarningCode)[keyof typeof LeadImportWarningCode];

export const LEAD_IMPORT_WARNING_CODE_VALUES = [
  LeadImportWarningCode.IgnoredColumn,
  LeadImportWarningCode.UnknownStatusFallback,
  LeadImportWarningCode.EmptyImprovementToken,
] as const;
