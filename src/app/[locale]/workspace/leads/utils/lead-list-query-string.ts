import { LeadListQueryParam } from "@/common/constants/leads/lead-list-query-params";
import type { LeadFilterInput } from "@/server/workspace/leads/services/lead-filter/lead-filter.schema";
import { LEAD_SORT_VALUES } from "@/common/constants/leads/lead-sort";

export function buildLeadListQueryString(
  filters: LeadFilterInput,
  page: number,
  sort: (typeof LEAD_SORT_VALUES)[number],
): string {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set(LeadListQueryParam.Status, filters.status);
  }

  if (filters.source) {
    params.set(LeadListQueryParam.Source, filters.source);
  }

  if (filters.category) {
    params.set(LeadListQueryParam.Category, filters.category);
  }

  if (filters.search) {
    params.set(LeadListQueryParam.Search, filters.search);
  }

  if (filters.date_from) {
    params.set(LeadListQueryParam.DateFrom, filters.date_from);
  }

  if (filters.date_to) {
    params.set(LeadListQueryParam.DateTo, filters.date_to);
  }

  if (filters.score_min !== undefined) {
    params.set(LeadListQueryParam.ScoreMin, String(filters.score_min));
  }

  params.set(LeadListQueryParam.Page, String(page));
  params.set(LeadListQueryParam.Sort, sort);

  return params.toString();
}
