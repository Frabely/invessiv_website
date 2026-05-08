import type { LeadImportRowIssueDto } from "@/common/contracts/leads";
import type { ValidatedLeadImportRow } from "@/server/workspace/leads/services/import/lead-import-valid-row";

export interface LeadImportValidationSuccess {
  ok: true;
  value: ValidatedLeadImportRow;
  issues: LeadImportRowIssueDto[];
}

export interface LeadImportValidationFailure {
  ok: false;
  issues: LeadImportRowIssueDto[];
}

export type LeadImportValidationResult =
  | LeadImportValidationSuccess
  | LeadImportValidationFailure;
