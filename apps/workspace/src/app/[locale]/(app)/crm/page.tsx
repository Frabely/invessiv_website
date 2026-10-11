import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { canOn } from "@/common/patterns/auth/can-on";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { CustomerFormDialogMode } from "@/common/constants/crm/forms/customer-form-dialog-modes";
import {
  buildCustomerCockpitCloseHref,
  buildCustomerCockpitHref,
  buildCustomerCreateHref,
  buildCustomerDialogCloseHref,
  readCockpitFeedbackRoundId,
  readCockpitProjectId,
  readCustomerCockpitId,
  readCustomerDialogRequest,
} from "@/common/patterns/crm/customer-dialog-query";
import { parseCustomerListFilters } from "@/common/patterns/crm/customer-list-search-params";
import { CustomerFormDialog } from "@/components/workspace/crm/form/customer-form-dialog/customer-form-dialog";
import { CustomersBasicList } from "@/components/workspace/crm/list/customers-basic-list/customers-basic-list";
import { CustomersPageHeader } from "@/components/workspace/crm/shell/customers-page-header/customers-page-header";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getCrmFormDictionary,
  getCrmListDictionary,
  getCrmMetaDictionary,
  getCrmShellDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { getLeadsSharedDictionary } from "@/i18n/dictionaries/workspace/leads";
import { requireWorkspaceArea } from "@/lib/auth/permissions";
import { workspaceAreaPathFor } from "@/lib/auth/routes";
import { resolveCustomerCategoryOptions } from "@/lib/workspace/crm/customer-category-options";
import {
  buildCustomerListHref,
  buildCustomerListQueryString,
} from "@/lib/workspace/crm/customer-list-query-string";
import { getCustomerById } from "@/server/workspace/crm/query-handler/get-customer-by-id.query-handler";
import { getCustomerCockpitById } from "@/server/workspace/crm/query-handler/get-customer-cockpit-by-id.query-handler";
import { listActiveCustomerCategories } from "@/server/workspace/crm/query-handler/list-active-customer-categories.query-handler";
import { listCustomers } from "@/server/workspace/crm/query-handler/list-customers.query-handler";
import { buildCustomerListViewModel } from "@/lib/workspace/crm/customer-list-view-model";
import { loadCustomerCockpit } from "@/lib/workspace/crm/load-customer-cockpit";
import { CustomerCockpitContent } from "@/components/workspace/crm/detail/customer-cockpit-content/customer-cockpit-content";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CrmPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: CrmPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getCrmMetaDictionary(locale);
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function CrmPage({ params, searchParams }: CrmPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // Layouts are not re-rendered on search param changes, so the page gates its own data.
  const actor = await requireWorkspaceArea(locale, WorkspaceArea.Crm);
  const activeLocale: Locale = locale;
  const resolvedSearchParams = await searchParams;
  const requestedFilters = parseCustomerListFilters(resolvedSearchParams);
  const basePath = workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm);
  const leadsBasePath = workspaceAreaPathFor(activeLocale, WorkspaceArea.Leads);
  const canWrite = canAnywhere(actor, Permission.CustomersWrite);
  const canReadLeads = can(actor, Permission.LeadsRead);
  const dialogRequest = canWrite
    ? readCustomerDialogRequest(resolvedSearchParams)
    : null;
  const cockpitCustomerId = readCustomerCockpitId(resolvedSearchParams);

  const editCustomerId =
    dialogRequest?.mode === CustomerFormDialogMode.Edit
      ? dialogRequest.customerId
      : null;
  // A customer reached only through a project-scoped grant is not writable itself, so the
  // edit dialog stays closed for it exactly like for an unknown id — no error, just no dialog.
  const canEditDialogCustomer =
    editCustomerId !== null &&
    canOn(actor, Permission.CustomersWrite, { customerId: editCustomerId });

  const [customerList, editCustomer, cockpitCustomer] = await Promise.all([
    listCustomers(requestedFilters, actor),
    editCustomerId && canEditDialogCustomer
      ? getCustomerById(editCustomerId, actor, canReadLeads)
      : null,
    cockpitCustomerId ? getCustomerCockpitById(cockpitCustomerId, actor) : null,
  ]);
  if (cockpitCustomerId && !cockpitCustomer) {
    notFound();
  }
  const { customerListWithValues, writableCustomerIds } =
    await buildCustomerListViewModel(customerList, actor);
  const cockpitViewModel = cockpitCustomer
    ? await loadCustomerCockpit({
        actor,
        customer: cockpitCustomer,
        locale: activeLocale,
        requestedProjectId: readCockpitProjectId(resolvedSearchParams),
        requestedRoundId: readCockpitFeedbackRoundId(resolvedSearchParams),
      })
    : null;
  const filters = { ...requestedFilters, page: customerList.page };
  const queryString = buildCustomerListQueryString(filters);
  const createHref = canWrite
    ? buildCustomerCreateHref(basePath, queryString)
    : null;
  const closeHref = buildCustomerDialogCloseHref(basePath, queryString);
  const dialogQueryString = new URLSearchParams(queryString);
  if (dialogRequest?.mode === CustomerFormDialogMode.Edit && editCustomer) {
    dialogQueryString.set("mode", CustomerFormDialogMode.Edit);
    dialogQueryString.set("edit", editCustomer.id);
  }
  const cockpitCloseHref = buildCustomerCockpitCloseHref(
    basePath,
    dialogQueryString.toString(),
  );
  const archivedToggleHref = buildCustomerListHref(basePath, {
    ...filters,
    includeArchived: !filters.includeArchived,
    page: 1,
  });
  // An unknown edit id opens nothing; it is not an error.
  const showDialog =
    dialogRequest?.mode === CustomerFormDialogMode.Create ||
    editCustomer !== null;
  const categories = showDialog ? await listActiveCustomerCategories() : [];

  return (
    <WorkspaceScrollablePageShell pageId="crm">
      <CustomersPageHeader
        archivedToggleHref={archivedToggleHref}
        content={getCrmShellDictionary(activeLocale)}
        createHref={createHref}
        includeArchived={filters.includeArchived}
      />
      <CustomersBasicList
        basePath={basePath}
        content={getCrmListDictionary(activeLocale)}
        createHref={createHref}
        customerList={customerListWithValues}
        filteredEmptyHref={archivedToggleHref}
        locale={activeLocale}
        queryString={queryString}
        writableCustomerIds={writableCustomerIds}
      />
      {showDialog ? (
        <CustomerFormDialog
          categories={resolveCustomerCategoryOptions(
            categories,
            getLeadsSharedDictionary(activeLocale),
          )}
          closeHref={closeHref}
          content={getCrmFormDictionary(activeLocale)}
          customer={editCustomer}
          key={editCustomer?.id ?? CustomerFormDialogMode.Create}
          locale={activeLocale}
          leadsBasePath={canReadLeads ? leadsBasePath : undefined}
          cockpitHref={
            editCustomer
              ? buildCustomerCockpitHref(
                  basePath,
                  editCustomer.id,
                  dialogQueryString.toString(),
                )
              : undefined
          }
        />
      ) : null}
      {cockpitViewModel ? (
        <CustomerCockpitContent
          viewModel={cockpitViewModel}
          locale={activeLocale}
          closeHref={cockpitCloseHref}
        />
      ) : null}
    </WorkspaceScrollablePageShell>
  );
}
