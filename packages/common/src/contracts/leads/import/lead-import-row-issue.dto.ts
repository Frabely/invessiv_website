import type { LeadImportColumnKey } from "@invessiv/common/constants/leads/import/columns/lead-import-column-keys";
import type { LeadImportRowIssueCode } from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-codes";
import type { LeadImportRowIssueSeverity } from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-severities";
import type { LeadImportWarningCode } from "@invessiv/common/constants/leads/import/warnings/lead-import-warning-codes";

export interface LeadImportRowIssueDto {
  rowIndex: number;
  column?: LeadImportColumnKey;
  code: LeadImportRowIssueCode | LeadImportWarningCode;
  severity: LeadImportRowIssueSeverity;
}
