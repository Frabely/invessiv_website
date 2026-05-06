import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { LeadsPageHeader } from "@/components/workspace/leads/shell/leads-page-header/leads-page-header";
import { LeadsPageShell } from "@/components/workspace/leads/shell/leads-page-shell/leads-page-shell";
import { LeadsPagination } from "@/components/workspace/leads/table/leads-pagination/leads-pagination";
import { LeadsTable } from "@/components/workspace/leads/table/leads-table/leads-table";
import { LEAD_SORT_VALUES, LeadSort } from "@/common/constants/leads/lead-sort";
import { buildQueryStringFromSearchParams } from "@/components/workspace/leads/table/lead-table-utils";
import {
  getLeadsMetaDictionary,
  getLeadsPaginationDictionary,
  getLeadsSharedDictionary,
  getLeadsShellDictionary,
  getLeadsTableDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { listLeads } from "@/server/workspace/leads/query-handler/list-leads.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeadsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: LeadsPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getLeadsMetaDictionary(locale as Locale);
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

function getSingleSearchParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function getPositivePageNumber(value: string | undefined): number {
  if (!value) {
    return 1;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function hasActiveLeadFilters(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return [
    "status",
    "source",
    "category",
    "search",
    "date_from",
    "date_to",
    "score_min",
  ].some((key) => {
    const value = getSingleSearchParam(searchParams, key);
    return typeof value === "string"
      ? value.trim().length > 0 && value !== "all"
      : false;
  });
}

export default async function LeadsPage({
  params,
  searchParams,
}: LeadsPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const shellContent = getLeadsShellDictionary(locale as Locale);
  const paginationContent = getLeadsPaginationDictionary(locale as Locale);
  const sharedContent = getLeadsSharedDictionary(locale as Locale);
  const tableContent = getLeadsTableDictionary(locale as Locale);
  const sortParam = getSingleSearchParam(resolvedSearchParams, "sort");
  const sort =
    sortParam &&
    LEAD_SORT_VALUES.includes(sortParam as (typeof LEAD_SORT_VALUES)[number])
      ? (sortParam as (typeof LEAD_SORT_VALUES)[number])
      : undefined;
  const resolvedSort = sort ?? LeadSort.CreatedDesc;
  const requestedPage = getPositivePageNumber(
    getSingleSearchParam(resolvedSearchParams, "page"),
  );
  let leadList = await listLeads({ page: requestedPage, sort: resolvedSort });
  const totalPages = Math.max(1, Math.ceil(leadList.total / leadList.perPage));
  const currentPage =
    leadList.total > 0 ? Math.min(requestedPage, totalPages) : 1;

  if (leadList.total > 0 && requestedPage > totalPages) {
    leadList = await listLeads({ page: currentPage, sort: resolvedSort });
  }

  const queryString = buildQueryStringFromSearchParams({
    ...resolvedSearchParams,
    page: String(currentPage),
    sort: resolvedSort,
  });
  const hasFilters = hasActiveLeadFilters(resolvedSearchParams);

  return (
    <LeadsPageShell>
      <LeadsPageHeader content={shellContent} />
      <LeadsTable
        basePath={`/${locale}/workspace/leads`}
        emptyState={
          leadList.total === 0
            ? {
                actionHref: hasFilters
                  ? `/${locale}/workspace/leads`
                  : undefined,
                actionLabel: hasFilters
                  ? paginationContent.emptyState.noResultsAction
                  : paginationContent.emptyState.noLeadsAction,
                description: hasFilters
                  ? paginationContent.emptyState.noResultsDescription
                  : paginationContent.emptyState.noLeadsDescription,
                title: hasFilters
                  ? paginationContent.emptyState.noResultsTitle
                  : paginationContent.emptyState.noLeadsTitle,
                variant: hasFilters ? "filtered" : "empty",
              }
            : undefined
        }
        locale={locale as Locale}
        queryString={queryString}
        rows={leadList.rows}
        sharedContent={sharedContent}
        tableContent={tableContent}
      />
      <LeadsPagination
        basePath={`/${locale}/workspace/leads`}
        content={paginationContent}
        currentPage={currentPage}
        perPage={leadList.perPage}
        queryString={queryString}
        total={leadList.total}
      />
    </LeadsPageShell>
  );
}
