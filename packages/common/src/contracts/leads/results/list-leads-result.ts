import type { LeadSummaryDto } from "@invessiv/common/contracts/leads/lead-summary.dto";

export type ListLeadsResult = {
  rows: LeadSummaryDto[];
  total: number;
  page: number;
  perPage: number;
};
