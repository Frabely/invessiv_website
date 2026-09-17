import type { LeadSummaryDto } from "@invessiv/common/contracts/leads/lead-summary.dto";

export type ListLeadsResult = {
  /** Converted leads omitted by the default view. */
  hiddenConvertedCount: number;
  rows: LeadSummaryDto[];
  total: number;
  page: number;
  perPage: number;
};
