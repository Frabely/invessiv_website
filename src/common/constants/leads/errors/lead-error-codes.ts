export const LeadErrorCode = {
  EmailExists: "EMAIL_EXISTS",
  CompanyNameExists: "COMPANY_NAME_EXISTS",
  ValidationError: "VALIDATION_ERROR",
  NotFound: "NOT_FOUND",
  Internal: "INTERNAL",
} as const;

export type LeadErrorCode = (typeof LeadErrorCode)[keyof typeof LeadErrorCode];

export const LEAD_ERROR_CODE_VALUES = [
  LeadErrorCode.EmailExists,
  LeadErrorCode.CompanyNameExists,
  LeadErrorCode.ValidationError,
  LeadErrorCode.NotFound,
  LeadErrorCode.Internal,
] as const;

export const LeadValidationIssueCode = {
  LastNameOrCompanyNameRequired: "last_name_or_company_name_required",
  BulkEditEmptyPatch: "bulk_edit_empty_patch",
  BulkEditStatusArchiveDisallowed: "bulk_edit_status_archive_disallowed",
} as const;

export type LeadValidationIssueCode =
  (typeof LeadValidationIssueCode)[keyof typeof LeadValidationIssueCode];

export const LEAD_VALIDATION_ISSUE_CODE_VALUES = [
  LeadValidationIssueCode.LastNameOrCompanyNameRequired,
  LeadValidationIssueCode.BulkEditEmptyPatch,
  LeadValidationIssueCode.BulkEditStatusArchiveDisallowed,
] as const;
