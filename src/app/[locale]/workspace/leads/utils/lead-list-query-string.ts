import { LeadListQueryParam } from "@/common/constants/leads/lead-list-query-params";
import type { LeadFilterInput } from "@/server/workspace/leads/services/lead-filter/lead-filter.schema";
import { LEAD_SORT_VALUES } from "@/common/constants/leads/lead-sort";

type SearchParamsInput = Record<string, string | string[] | undefined>;

const LEAD_LIST_CLOSE_QUERY_PARAMS = [
  LeadListQueryParam.Status,
  LeadListQueryParam.Source,
  LeadListQueryParam.Category,
  LeadListQueryParam.Search,
  LeadListQueryParam.DateFrom,
  LeadListQueryParam.DateTo,
  LeadListQueryParam.Page,
  LeadListQueryParam.Sort,
  LeadListQueryParam.ScoreMin,
] as const;

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

export function buildLeadListCloseHref(
  basePath: string,
  searchParams: SearchParamsInput,
): string {
  const params = new URLSearchParams();
  const supportedParams = new Set<string>(LEAD_LIST_CLOSE_QUERY_PARAMS);

  for (const [key, value] of Object.entries(searchParams)) {
    if (
      key === LeadListQueryParam.Selected ||
      key === LeadListQueryParam.Edit ||
      !supportedParams.has(key) ||
      value === undefined
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, value);
  }

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function withoutDialogParams(searchParams: SearchParamsInput): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (
      key === LeadListQueryParam.Create ||
      key === LeadListQueryParam.Edit ||
      value === undefined
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
      continue;
    }

    params.set(key, value);
  }

  return params;
}

function buildHref(basePath: string, params: URLSearchParams): string {
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function buildLeadCreateHref(
  basePath: string,
  searchParams: SearchParamsInput,
): string {
  const params = withoutDialogParams(searchParams);
  params.set(LeadListQueryParam.Create, "");
  return buildHref(basePath, params);
}

export function buildLeadEditHref(
  basePath: string,
  leadId: string,
  searchParams: SearchParamsInput,
): string {
  const params = withoutDialogParams(searchParams);
  params.set(LeadListQueryParam.Edit, leadId);
  return buildHref(basePath, params);
}

export function buildLeadDialogCloseHref(
  basePath: string,
  searchParams: SearchParamsInput,
): string {
  return buildHref(basePath, withoutDialogParams(searchParams));
}
