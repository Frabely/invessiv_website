import "server-only";
import { DashboardQueryParam } from "@/common/constants/dashboard/dashboard-query-params";
import { DEFAULT_DASHBOARD_RANGE_DAYS } from "@/common/constants/dashboard/dashboard-defaults";
import type { RangeSelection } from "@/common/contracts/range-selection";

type SearchParamsInput = Record<string, string | string[] | undefined>;

type ResolveOptions = {
  now?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function readParam(
  searchParams: SearchParamsInput,
  key: string,
): string | undefined {
  const raw = searchParams[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || undefined;
}

function parseIsoDateAtStartOfDay(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseIsoDateAtEndOfDay(value: string): Date | null {
  if (!ISO_DATE_PATTERN.test(value)) {
    return null;
  }
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateForInput(date: Date): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function resolveDashboardRange(
  searchParams: SearchParamsInput,
  options: ResolveOptions = {},
): RangeSelection {
  const now = options.now ?? new Date();
  const defaultTo = new Date(now.getTime());
  const defaultFrom = new Date(
    now.getTime() - DEFAULT_DASHBOARD_RANGE_DAYS * DAY_MS,
  );

  const rawFrom = readParam(searchParams, DashboardQueryParam.DateFrom);
  const rawTo = readParam(searchParams, DashboardQueryParam.DateTo);

  const parsedFrom = rawFrom ? parseIsoDateAtStartOfDay(rawFrom) : null;
  const parsedTo = rawTo ? parseIsoDateAtEndOfDay(rawTo) : null;

  let from = parsedFrom ?? defaultFrom;
  let to = parsedTo ?? defaultTo;

  if (from.getTime() > to.getTime()) {
    from = parsedTo ? new Date(parsedTo.getTime()) : defaultFrom;
    to = parsedFrom ? new Date(parsedFrom.getTime()) : defaultTo;
  }

  const spanMs = to.getTime() - from.getTime();
  const previousTo = new Date(from.getTime());
  const previousFrom = new Date(from.getTime() - Math.max(spanMs, DAY_MS));

  return {
    from,
    to,
    previousFrom,
    previousTo,
    fromInputValue: formatDateForInput(from),
    toInputValue: formatDateForInput(to),
  };
}

export const rangeResolverService = {
  resolveDashboardRange,
} as const;
