import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { LeadsPageHeader } from "@/components/workspace/leads/shell/leads-page-header/leads-page-header";
import { LeadsPageShell } from "@/components/workspace/leads/shell/leads-page-shell/leads-page-shell";
import { LeadsTable } from "@/components/workspace/leads/table/leads-table/leads-table";
import { LEAD_SORT_VALUES, LeadSort } from "@/common/constants/leads/lead-sort";
import { buildQueryStringFromSearchParams } from "@/components/workspace/leads/table/lead-table-utils";
import {
  getLeadsMetaDictionary,
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
  const sharedContent = getLeadsSharedDictionary(locale as Locale);
  const tableContent = getLeadsTableDictionary(locale as Locale);
  const sortParam = getSingleSearchParam(resolvedSearchParams, "sort");
  const sort =
    sortParam &&
    LEAD_SORT_VALUES.includes(sortParam as (typeof LEAD_SORT_VALUES)[number])
      ? (sortParam as (typeof LEAD_SORT_VALUES)[number])
      : undefined;
  const resolvedSort = sort ?? LeadSort.CreatedDesc;
  const queryString = buildQueryStringFromSearchParams({
    ...resolvedSearchParams,
    sort: resolvedSort,
  });
  const leadList = await listLeads({ sort: resolvedSort });

  return (
    <LeadsPageShell>
      <LeadsPageHeader content={shellContent} />
      <LeadsTable
        basePath={`/${locale}/workspace/leads`}
        locale={locale as Locale}
        queryString={queryString}
        rows={leadList.rows}
        sharedContent={sharedContent}
        tableContent={tableContent}
      />
    </LeadsPageShell>
  );
}
