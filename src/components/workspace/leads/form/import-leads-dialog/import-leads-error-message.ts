import type { LeadImportErrorCode } from "@/common/constants/leads/lead-import-error-codes";
import type { LeadImportRowIssueCode } from "@/common/constants/leads/lead-import-row-issue-codes";
import type { LeadImportWarningCode } from "@/common/constants/leads/lead-import-warning-codes";
import type { LeadsImportDictionary } from "@/i18n/dictionaries/workspace/leads";

export function getLeadImportErrorMessage(
  code: LeadImportErrorCode | "client_too_large",
  dict: LeadsImportDictionary,
): string {
  const key = code as keyof typeof dict.errors;
  return dict.errors[key] ?? dict.errors.generic;
}

export function getLeadImportRowIssueMessage(
  code: LeadImportRowIssueCode | LeadImportWarningCode,
  dict: LeadsImportDictionary,
): string {
  if (code in dict.row_issues) {
    return dict.row_issues[code as keyof typeof dict.row_issues];
  }
  if (code in dict.warnings) {
    return dict.warnings[code as keyof typeof dict.warnings];
  }
  return code;
}
