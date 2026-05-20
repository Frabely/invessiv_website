import { z } from "zod";
import {
  CONTACT_LEAD_STATUS_ALL,
  CONTACT_LEAD_STATUS_VALUES,
} from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadListQueryParam } from "@invessiv/common/constants/leads/list/lead-list-query-params";
import {
  LEAD_SOURCES_VALUES,
  type LeadSource,
} from "@invessiv/common/constants/leads/sources/lead-sources";
import {
  LEAD_SORT_VALUES,
  LeadSort,
  type LeadSort as LeadSortType,
} from "@invessiv/common/constants/leads/list/lead-sort";
import type { LeadFilterInput } from "@/server/workspace/leads/services/lead-filter/lead-filter.schema";

type SearchParamsInput = Record<string, string | string[] | undefined>;

const FILTER_STATUS_VALUES = [
  CONTACT_LEAD_STATUS_ALL,
  ...CONTACT_LEAD_STATUS_VALUES,
] as const;
type FilterStatusValue = (typeof FILTER_STATUS_VALUES)[number];

function getSingleSearchParam(
  searchParams: SearchParamsInput,
  key: string,
): string | undefined {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function getTrimmedSearchParam(
  searchParams: SearchParamsInput,
  key: string,
): string | undefined {
  const value = getSingleSearchParam(searchParams, key)?.trim();
  return value && value.length > 0 ? value : undefined;
}

function parsePositiveInteger(
  searchParams: SearchParamsInput,
  key: string,
): number | undefined {
  const value = getSingleSearchParam(searchParams, key);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }

  return parsed;
}

function parseScoreMin(
  searchParams: SearchParamsInput,
  key: string,
): number | undefined {
  const value = getSingleSearchParam(searchParams, key);
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    return undefined;
  }

  return parsed;
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

export function isUuid(value: string): boolean {
  return z.uuid().safeParse(value).success;
}

export function parseSelectedLeadId(
  searchParams: SearchParamsInput,
): string | undefined {
  const selected = getTrimmedSearchParam(
    searchParams,
    LeadListQueryParam.Selected,
  );

  return selected && isUuid(selected) ? selected : undefined;
}

export function parseEditLeadId(
  searchParams: SearchParamsInput,
): string | undefined {
  const edit = getTrimmedSearchParam(
    searchParams,
    LeadListQueryParam.TargetLeadId,
  );

  return edit && isUuid(edit) ? edit : undefined;
}

export function parseLeadListFilters(
  searchParams: SearchParamsInput,
): LeadFilterInput {
  const status = getTrimmedSearchParam(searchParams, LeadListQueryParam.Status);
  const source = getTrimmedSearchParam(searchParams, LeadListQueryParam.Source);
  const category = getTrimmedSearchParam(
    searchParams,
    LeadListQueryParam.Category,
  );
  const search = getTrimmedSearchParam(searchParams, LeadListQueryParam.Search);
  const dateFrom = getTrimmedSearchParam(
    searchParams,
    LeadListQueryParam.DateFrom,
  );
  const dateTo = getTrimmedSearchParam(searchParams, LeadListQueryParam.DateTo);
  const sort = getTrimmedSearchParam(searchParams, LeadListQueryParam.Sort);

  const filters: LeadFilterInput = {};

  if (
    status &&
    (FILTER_STATUS_VALUES as readonly string[]).includes(status) &&
    status !== CONTACT_LEAD_STATUS_ALL
  ) {
    filters.status = status as FilterStatusValue;
  }

  if (source && (LEAD_SOURCES_VALUES as readonly string[]).includes(source)) {
    filters.source = source as LeadSource;
  }

  if (category && isUuid(category)) {
    filters.category = category;
  }

  if (search) {
    filters.search = search;
  }

  if (dateFrom && isValidDateString(dateFrom)) {
    filters.date_from = dateFrom;
  }

  if (dateTo && isValidDateString(dateTo)) {
    filters.date_to = dateTo;
  }

  const page = parsePositiveInteger(searchParams, LeadListQueryParam.Page);
  if (page) {
    filters.page = page;
  }

  const scoreMin = parseScoreMin(searchParams, LeadListQueryParam.ScoreMin);
  if (scoreMin !== undefined) {
    filters.score_min = scoreMin;
  }

  if (sort && (LEAD_SORT_VALUES as readonly string[]).includes(sort)) {
    filters.sort = sort as LeadSortType;
  } else if (sort === LeadSort.CreatedDesc) {
    filters.sort = LeadSort.CreatedDesc;
  }

  return filters;
}

export function hasActiveLeadFilters(filters: LeadFilterInput): boolean {
  return Boolean(
    filters.status ||
    filters.source ||
    filters.category ||
    filters.search ||
    filters.date_from ||
    filters.date_to ||
    filters.score_min !== undefined,
  );
}
