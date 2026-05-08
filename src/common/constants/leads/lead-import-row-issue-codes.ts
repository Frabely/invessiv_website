export const LeadImportRowIssueCode = {
  MissingEmail: "missing_email",
  MissingNameOrCompany: "missing_name_or_company",
  InvalidEmail: "invalid_email",
  InvalidUrl: "invalid_url",
  InvalidScore: "invalid_score",
  InvalidExternalGuid: "invalid_external_guid",
  UnknownCategoryId: "unknown_category_id",
  DuplicateEmailInFile: "duplicate_email_in_file",
  DuplicateExternalGuidInFile: "duplicate_external_guid_in_file",
  DuplicateEmail: "duplicate_email",
  DuplicateExternalGuid: "duplicate_external_guid",
  ConflictEmailGuidMismatch: "conflict_email_guid_mismatch",
} as const;

export type LeadImportRowIssueCode =
  (typeof LeadImportRowIssueCode)[keyof typeof LeadImportRowIssueCode];

export const LEAD_IMPORT_ROW_ISSUE_CODE_VALUES = [
  LeadImportRowIssueCode.MissingEmail,
  LeadImportRowIssueCode.MissingNameOrCompany,
  LeadImportRowIssueCode.InvalidEmail,
  LeadImportRowIssueCode.InvalidUrl,
  LeadImportRowIssueCode.InvalidScore,
  LeadImportRowIssueCode.InvalidExternalGuid,
  LeadImportRowIssueCode.UnknownCategoryId,
  LeadImportRowIssueCode.DuplicateEmailInFile,
  LeadImportRowIssueCode.DuplicateExternalGuidInFile,
  LeadImportRowIssueCode.DuplicateEmail,
  LeadImportRowIssueCode.DuplicateExternalGuid,
  LeadImportRowIssueCode.ConflictEmailGuidMismatch,
] as const;
