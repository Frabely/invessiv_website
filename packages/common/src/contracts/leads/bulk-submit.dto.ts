import type { BulkSubmitFailureKind as BulkSubmitFailureKindType } from "@invessiv/common/constants/leads/bulk/bulk-submit-failure-kinds";
import type { BulkEditLeadsPatch } from "@invessiv/common/contracts/leads/bulk-edit-leads-input";
import type { BulkEditLeadsFailedLead } from "@invessiv/common/contracts/leads/results/bulk-edit-leads-result";

export type BulkActionSubmitInputDto = {
  ids: string[];
};

export type BulkEditSubmitInputDto = {
  ids: string[];
  patch: BulkEditLeadsPatch;
};

export type BulkActionSubmitSuccessDto = {
  ok: true;
};

export type BulkActionFailureResultDto = {
  ok: false;
  kind: BulkSubmitFailureKindType;
};

export type BulkActionSubmitResultDto =
  | BulkActionSubmitSuccessDto
  | BulkActionFailureResultDto;

export type BulkEditSubmitSuccessDto = {
  ok: true;
  updatedCount: number;
  failedLeads: BulkEditLeadsFailedLead[];
};

export type BulkEditSubmitFailureDto = BulkActionFailureResultDto;

export type BulkEditSubmitResultDto =
  | BulkEditSubmitSuccessDto
  | BulkEditSubmitFailureDto;
