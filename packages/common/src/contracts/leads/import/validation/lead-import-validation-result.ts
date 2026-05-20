import type { LeadImportRowIssueDto } from "@invessiv/common/contracts/leads";
import type { ValidatedLeadImportRow } from "@invessiv/common/contracts/leads/import/validation/lead-import-valid-row";

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
