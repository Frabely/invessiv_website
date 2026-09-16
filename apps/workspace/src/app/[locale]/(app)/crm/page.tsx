import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { CustomerFormDialogMode } from "@/common/constants/crm/forms/customer-form-dialog-modes";
import {
  buildCustomerCreateHref,
  buildCustomerDialogCloseHref,
  readCustomerDialogRequest,
} from "@/common/patterns/crm/customer-dialog-query";
import { CustomerFormDialog } from "@/components/workspace/crm/form/customer-form-dialog/customer-form-dialog";
import { CustomersBasicList } from "@/components/workspace/crm/list/customers-basic-list/customers-basic-list";
import { CustomersPageHeader } from "@/components/workspace/crm/shell/customers-page-header/customers-page-header";
import { WorkspacePageShell } from "@/components/workspace/workspace-page-shell/workspace-page-shell";
import { ListPagination } from "@/components/workspace/shared/table/list-pagination/list-pagination";
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
import { listActiveCustomerCategories } from "@/server/workspace/crm/query-handler/list-active-customer-categories.query-handler";
import { listCustomers } from "@/server/workspace/crm/query-handler/list-customers.query-handler";
import { parseCustomerListFilters } from "@/server/workspace/crm/shared/customer-list-search-params";

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
  const canWrite = can(actor, Permission.CustomersWrite);
  const dialogRequest = canWrite
    ? readCustomerDialogRequest(resolvedSearchParams)
    : null;

  const [customerList, editCustomer] = await Promise.all([
    listCustomers(requestedFilters),
    dialogRequest?.mode === CustomerFormDialogMode.Edit
      ? getCustomerById(dialogRequest.customerId)
      : null,
  ]);
  const filters = { ...requestedFilters, page: customerList.page };
  const queryString = buildCustomerListQueryString(filters);
  const createHref = canWrite
    ? buildCustomerCreateHref(basePath, queryString)
    : null;
  const closeHref = buildCustomerDialogCloseHref(basePath, queryString);
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
    <WorkspacePageShell pageId="crm">
      <CustomersPageHeader
        archivedToggleHref={archivedToggleHref}
        content={getCrmShellDictionary(activeLocale)}
        createHref={createHref}
        includeArchived={filters.includeArchived}
      />
      <CustomersBasicList
        basePath={basePath}
        canWrite={canWrite}
        content={getCrmListDictionary(activeLocale)}
        createHref={createHref}
        customers={customerList.rows}
        locale={activeLocale}
        queryString={queryString}
      />
      <ListPagination
        basePath={basePath}
        content={getCrmListDictionary(activeLocale)}
        currentPage={customerList.page}
        perPage={customerList.perPage}
        queryString={queryString}
        total={customerList.total}
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
        />
      ) : null}
    </WorkspacePageShell>
  );
}
