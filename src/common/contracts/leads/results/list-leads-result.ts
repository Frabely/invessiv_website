import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";

export type ListLeadsResult = {
  rows: LeadSummaryDto[];
  total: number;
  page: number;
  perPage: number;
};
