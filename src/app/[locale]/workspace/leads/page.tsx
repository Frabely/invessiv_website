import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { LeadsPageHeader } from "@/components/workspace/leads/shell/leads-page-header/leads-page-header";
import { LeadsPageShell } from "@/components/workspace/leads/shell/leads-page-shell/leads-page-shell";
import { LeadsToolbar } from "@/components/workspace/leads/toolbar/leads-toolbar/leads-toolbar";
import { LeadsPagination } from "@/components/workspace/leads/table/leads-pagination/leads-pagination";
import { LeadsTable } from "@/components/workspace/leads/table/leads-table/leads-table";
import type { LeadCategoryDto } from "@/common/contracts/leads/lead-category.dto";
import { LeadSort } from "@/common/constants/leads/lead-sort";
import {
  getLeadsDetailDictionary,
  getLeadsMetaDictionary,
  getLeadsPaginationDictionary,
  getLeadsSharedDictionary,
  getLeadsShellDictionary,
  getLeadsTableDictionary,
  getLeadsToolbarDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { getLeadCategories } from "@/server/workspace/leads/query-handler/list-lead-categories.query-handler";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { listLeads } from "@/server/workspace/leads/query-handler/list-leads.query-handler";
import { LEADS_BASE_PATH } from "./page-constants";
import {
  buildLeadListCloseHref,
  buildLeadListQueryString,
} from "./utils/lead-list-query-string";
import {
  hasActiveLeadFilters,
  parseLeadListFilters,
  parseSelectedLeadId,
} from "./utils/lead-list-search-params";

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
  const toolbarContent = getLeadsToolbarDictionary(locale as Locale);
  const paginationContent = getLeadsPaginationDictionary(locale as Locale);
  const sharedContent = getLeadsSharedDictionary(locale as Locale);
  const tableContent = getLeadsTableDictionary(locale as Locale);
  const detailContent = getLeadsDetailDictionary(locale as Locale);
  const parsedFilters = parseLeadListFilters(resolvedSearchParams);
  const selectedLeadId = parseSelectedLeadId(resolvedSearchParams);
  const resolvedSort = parsedFilters.sort ?? LeadSort.CreatedDesc;
  const requestedPage = parsedFilters.page ?? 1;
  let leadList = await listLeads({
    ...parsedFilters,
    page: requestedPage,
    sort: resolvedSort,
  });
  const totalPages = Math.max(1, Math.ceil(leadList.total / leadList.perPage));
  const currentPage =
    leadList.total > 0 ? Math.min(requestedPage, totalPages) : 1;

  if (leadList.total > 0 && requestedPage > totalPages) {
    leadList = await listLeads({
      ...parsedFilters,
      page: currentPage,
      sort: resolvedSort,
    });
  }

  const queryString = buildLeadListQueryString(
    { ...parsedFilters, page: currentPage, sort: resolvedSort },
    currentPage,
    resolvedSort,
  );
  const hasFilters = hasActiveLeadFilters(parsedFilters);
  const categories = await getLeadCategories();
  const basePath = `/${locale}${LEADS_BASE_PATH}`;
  const selectedLead = selectedLeadId
    ? await getLeadById(selectedLeadId)
    : null;
  const detailCloseHref = buildLeadListCloseHref(
    basePath,
    resolvedSearchParams,
  );

  if (selectedLeadId && !selectedLead) {
    redirect(detailCloseHref);
  }

  const detailPanelProps = selectedLead
    ? {
        closeHref: detailCloseHref,
        content: detailContent,
        lead: selectedLead,
        locale: locale as Locale,
        sharedContent,
      }
    : undefined;
  const categoryOptions = categories.map((category: LeadCategoryDto) => ({
    id: category.id,
    labelKey: category.labelKey,
    label:
      sharedContent.category[
        category.labelKey as keyof typeof sharedContent.category
      ] ?? category.labelKey,
  }));

  return (
    <LeadsPageShell detailPanelProps={detailPanelProps}>
      <LeadsPageHeader content={shellContent} />
      <LeadsToolbar
        basePath={basePath}
        categories={categoryOptions}
        content={toolbarContent}
        currentQueryString={queryString}
        sharedContent={sharedContent}
      />
      <LeadsTable
        basePath={basePath}
        emptyState={
          leadList.total === 0
            ? {
                actionHref: hasFilters ? basePath : undefined,
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
        basePath={basePath}
        content={paginationContent}
        currentPage={currentPage}
        perPage={leadList.perPage}
        queryString={queryString}
        total={leadList.total}
      />
    </LeadsPageShell>
  );
}
