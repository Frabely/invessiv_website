import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { DateRangePreset } from "@/common/constants/date-range/date-range-presets";
import { getDateRangeForPreset } from "@/common/patterns/date-range/date-range-preset-range";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { requireWorkspaceArea } from "@/lib/auth/permissions";
import { resolveLeadActionPermissions } from "@/common/patterns/leads/resolve-lead-action-permissions";
import { createLocalePathname } from "@/lib/navigation/locale-pathname";
import { LeadFormDialog } from "@/components/workspace/leads/form/lead-form-dialog/lead-form-dialog";
import { CustomerFormDialog } from "@/components/workspace/crm/form/customer-form-dialog/customer-form-dialog";
import { LeadsPageHeader } from "@/components/workspace/leads/shell/leads-page-header/leads-page-header";
import { LeadsPageShell } from "@/components/workspace/leads/shell/leads-page-shell/leads-page-shell";
import { ListPagination } from "@/components/workspace/shared/table/list-pagination/list-pagination";
import { LeadsTable } from "@/components/workspace/leads/table/leads-table/leads-table";
import { LeadsTableTransitionProvider } from "@/components/workspace/leads/table/leads-table-transition-provider/leads-table-transition-provider";
import type { LeadCategoryOption } from "@invessiv/common/contracts/leads/lead-category-option";
import type { LeadCategoryDto } from "@invessiv/common/contracts/leads/lead-category.dto";
import { LeadFormDialogMode } from "@invessiv/common/constants/leads/forms/lead-form-dialog-modes";
import {
  LeadsEmptyStateVariant,
  type LeadsEmptyStateVariant as LeadsEmptyStateVariantValue,
} from "@invessiv/common/constants/leads/list/lead-empty-state-variants";
import { LeadSort } from "@invessiv/common/constants/leads/list/lead-sort";
import {
  getLeadsBulkDictionary,
  getLeadsDeleteDictionary,
  getLeadsDetailDictionary,
  getLeadsFormDictionary,
  getLeadsImportDictionary,
  getLeadsMetaDictionary,
  getLeadsOutreachDictionary,
  getLeadsPaginationDictionary,
  getLeadsSharedDictionary,
  getLeadsShellDictionary,
  getLeadsTableDictionary,
  getLeadsToolbarDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { getCrmFormDictionary } from "@/i18n/dictionaries/workspace/crm";
import { getLeadCategories } from "@/server/workspace/leads/query-handler/list-lead-categories.query-handler";
import { getLeadById } from "@/server/workspace/leads/query-handler/get-lead-by-id.query-handler";
import { listLeads } from "@/server/workspace/leads/query-handler/list-leads.query-handler";
import { LEADS_BASE_PATH } from "./page-constants";
import {
  buildLeadConversionCloseHref,
  buildLeadConversionHref,
  buildLeadCreateHref,
  buildLeadDetailPanelEditHref,
  buildLeadDialogCloseHref,
  buildLeadListCloseHref,
  buildLeadListQueryString,
  getLeadFormDialogMode,
} from "@/lib/workspace/leads/lead-list-query-string";
import {
  hasActiveLeadFilters,
  parseConvertLeadId,
  parseEditLeadId,
  parseLeadListFilters,
  parseSelectedLeadId,
} from "@/server/workspace/leads/shared/lead-list-search-params";
import { workspaceAreaPathFor } from "@/lib/auth/routes";
import { buildCustomerEditHref } from "@/common/patterns/crm/customer-dialog-query";
import { toLeadCustomerConversionSource } from "@/common/patterns/crm/lead-customer-conversion-source";

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

  // Layouts are not re-rendered on search param changes, so the page gates its own data.
  const actor = await requireWorkspaceArea(locale, WorkspaceArea.Leads);
  const leadActions = resolveLeadActionPermissions(actor);
  const canReadCustomers = can(actor, Permission.CustomersRead);
  const canConvertLeads =
    leadActions.canWrite &&
    canReadCustomers &&
    can(actor, Permission.CustomersWrite);

  const resolvedSearchParams = await searchParams;
  const shellContent = getLeadsShellDictionary(locale as Locale);
  const importContent = getLeadsImportDictionary(locale as Locale);
  const toolbarContent = getLeadsToolbarDictionary(locale as Locale);
  const formContent = getLeadsFormDictionary(locale as Locale);
  const paginationContent = getLeadsPaginationDictionary(locale as Locale);
  const sharedContent = getLeadsSharedDictionary(locale as Locale);
  const tableContent = getLeadsTableDictionary(locale as Locale);
  const deleteContent = getLeadsDeleteDictionary(locale as Locale);
  const detailContent = getLeadsDetailDictionary(locale as Locale);
  const bulkContent = getLeadsBulkDictionary(locale as Locale);
  const outreachContent = leadActions.canGenerateOutreach
    ? getLeadsOutreachDictionary(locale as Locale)
    : undefined;
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
  const emptyStateVariant: LeadsEmptyStateVariantValue = hasFilters
    ? LeadsEmptyStateVariant.Filtered
    : LeadsEmptyStateVariant.Empty;
  const categories = await getLeadCategories();
  const basePath = createLocalePathname(LEADS_BASE_PATH, locale);
  const crmBasePath = workspaceAreaPathFor(locale as Locale, WorkspaceArea.Crm);
  const addLeadHref = buildLeadCreateHref(basePath, resolvedSearchParams);
  const referenceDateValue =
    getDateRangeForPreset(DateRangePreset.Today).to ?? "";
  const selectedLead = selectedLeadId
    ? await getLeadById(selectedLeadId)
    : null;
  const editLeadId = parseEditLeadId(resolvedSearchParams);
  const convertLeadId = parseConvertLeadId(resolvedSearchParams);
  const editLead = editLeadId ? await getLeadById(editLeadId) : null;
  const detailCloseHref = buildLeadListCloseHref(
    basePath,
    resolvedSearchParams,
  );
  const dialogCloseHref = buildLeadDialogCloseHref(
    basePath,
    resolvedSearchParams,
  );

  if (selectedLeadId && !selectedLead) {
    redirect(detailCloseHref);
  }

  if (editLeadId && !editLead) {
    redirect(dialogCloseHref);
  }

  const detailPanelProps = selectedLead
    ? {
        canEdit: leadActions.canWrite,
        canConvert: canConvertLeads && !selectedLead.customerId,
        closeHref: detailCloseHref,
        content: detailContent,
        editHref: buildLeadDetailPanelEditHref(
          basePath,
          selectedLead.id,
          resolvedSearchParams,
        ),
        conversionHref: buildLeadConversionHref(
          basePath,
          selectedLead.id,
          resolvedSearchParams,
        ),
        customerHref:
          selectedLead.customerId && canReadCustomers
            ? buildCustomerEditHref(crmBasePath, selectedLead.customerId)
            : undefined,
        lead: selectedLead,
        locale: locale as Locale,
        outreachContent,
        sharedContent,
      }
    : undefined;
  const categoryOptions: LeadCategoryOption[] = categories.map(
    (category: LeadCategoryDto) => ({
      id: category.id,
      labelKey: category.labelKey,
      label:
        sharedContent.category[
          category.labelKey as keyof typeof sharedContent.category
        ] ?? category.labelKey,
    }),
  );
  const requestedDialogMode = getLeadFormDialogMode(resolvedSearchParams);
  const dialogMode = editLead
    ? LeadFormDialogMode.Edit
    : LeadFormDialogMode.Create;
  const dialogOpen =
    leadActions.canWrite &&
    (requestedDialogMode === LeadFormDialogMode.Create ||
      (requestedDialogMode === LeadFormDialogMode.Edit && Boolean(editLead)));
  const conversionDialogOpen =
    canConvertLeads &&
    Boolean(selectedLead) &&
    !selectedLead?.customerId &&
    convertLeadId === selectedLead?.id;

  return (
    <>
      <LeadsPageShell detailPanelProps={detailPanelProps}>
        <LeadsTableTransitionProvider>
          <LeadsPageHeader
            addLeadHref={addLeadHref}
            basePath={basePath}
            canCreateLead={leadActions.canWrite}
            categories={categoryOptions}
            currentQueryString={queryString}
            filtersContent={toolbarContent}
            hiddenConvertedCount={leadList.hiddenConvertedCount}
            importContent={leadActions.canImport ? importContent : undefined}
            referenceDateValue={referenceDateValue}
            sharedContent={sharedContent}
            shellContent={shellContent}
          />
          <LeadsTable
            actions={leadActions}
            basePath={basePath}
            bulkContent={bulkContent}
            categories={categoryOptions}
            deleteContent={deleteContent}
            emptyState={
              leadList.total === 0
                ? {
                    actionHref: hasFilters
                      ? basePath
                      : leadActions.canWrite
                        ? addLeadHref
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
                    variant: emptyStateVariant,
                  }
                : undefined
            }
            locale={locale as Locale}
            outreachContent={outreachContent}
            queryString={queryString}
            currentSearchParams={resolvedSearchParams}
            rows={leadList.rows}
            selectionResetKey={queryString}
            sharedContent={sharedContent}
            tableContent={tableContent}
          />
          <ListPagination
            basePath={basePath}
            content={paginationContent}
            currentPage={currentPage}
            perPage={leadList.perPage}
            queryString={queryString}
            total={leadList.total}
          />
        </LeadsTableTransitionProvider>
      </LeadsPageShell>
      <LeadFormDialog
        categories={categoryOptions}
        content={formContent}
        editLeadId={editLead?.id}
        initialLead={editLead ?? undefined}
        mode={dialogMode}
        open={dialogOpen}
        outreachContent={outreachContent}
        sharedContent={sharedContent}
      />
      {conversionDialogOpen && selectedLead ? (
        <CustomerFormDialog
          categories={categoryOptions}
          closeHref={buildLeadConversionCloseHref(
            basePath,
            resolvedSearchParams,
          )}
          content={getCrmFormDictionary(locale as Locale)}
          conversionSource={toLeadCustomerConversionSource(selectedLead)}
          crmBasePath={crmBasePath}
          customer={null}
          key={`convert-${selectedLead.id}`}
          locale={locale as Locale}
        />
      ) : null}
    </>
  );
}
