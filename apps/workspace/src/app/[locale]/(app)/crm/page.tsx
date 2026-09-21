import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { canOn } from "@/common/patterns/auth/can-on";
import { canAnywhere } from "@/common/patterns/auth/access-scope";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { SettingsTab } from "@/common/constants/access/settings-tabs";
import { buildSettingsTabHref } from "@/common/patterns/access/settings-tab";
import { CustomerFormDialogMode } from "@/common/constants/crm/forms/customer-form-dialog-modes";
import {
  buildCustomerCockpitCloseHref,
  buildCustomerCockpitHref,
  buildCustomerCreateHref,
  buildCustomerDialogCloseHref,
  readCustomerCockpitId,
  readCustomerDialogRequest,
} from "@/common/patterns/crm/customer-dialog-query";
import { parseCustomerListFilters } from "@/common/patterns/crm/customer-list-search-params";
import { CustomerFormDialog } from "@/components/workspace/crm/form/customer-form-dialog/customer-form-dialog";
import { CustomerCockpitDialog } from "@/components/workspace/crm/detail/customer-cockpit-dialog/customer-cockpit-dialog";
import { CustomersBasicList } from "@/components/workspace/crm/list/customers-basic-list/customers-basic-list";
import { CustomersPageHeader } from "@/components/workspace/crm/shell/customers-page-header/customers-page-header";
import { WorkspacePageShell } from "@/components/workspace/workspace-page-shell/workspace-page-shell";
import { ButtonLink } from "@invessiv/ui";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getCrmAccessDictionary,
  getCrmCockpitDictionary,
  getCrmFormDictionary,
  getCrmLineItemTemplatesDictionary,
  getCrmListDictionary,
  getCrmMetaDictionary,
  getCrmProjectLineItemsDictionary,
  getCrmShellDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { getSettingsPermissionsDictionary } from "@/i18n/dictionaries/workspace/settings";
import { getLeadsSharedDictionary } from "@/i18n/dictionaries/workspace/leads";
import { requireWorkspaceArea } from "@/lib/auth/permissions";
import {
  crmLineItemTemplatesPathFor,
  workspaceAreaPathFor,
} from "@/lib/auth/routes";
import { resolveCustomerCategoryOptions } from "@/lib/workspace/crm/customer-category-options";
import {
  buildCustomerListHref,
  buildCustomerListQueryString,
} from "@/lib/workspace/crm/customer-list-query-string";
import { getCustomerById } from "@/server/workspace/crm/query-handler/get-customer-by-id.query-handler";
import { getCustomerCockpitById } from "@/server/workspace/crm/query-handler/get-customer-cockpit-by-id.query-handler";
import { listActiveCustomerCategories } from "@/server/workspace/crm/query-handler/list-active-customer-categories.query-handler";
import { listCustomers } from "@/server/workspace/crm/query-handler/list-customers.query-handler";
import { listCockpitProjectsByCustomer } from "@/server/workspace/crm/query-handler/list-projects-by-customer.query-handler";
import { buildProjectLineItemsViewModel } from "@/lib/workspace/crm/project-line-items-view-model";
import { calculateProjectLineItemValue } from "@/common/patterns/crm/project-line-item-value";
import { listProjectLineItemsByCustomer } from "@/server/workspace/crm/query-handler/list-project-line-items-by-customer.query-handler";
import { listCustomerAccessScopes } from "@/server/workspace/access/query-handler/list-customer-access-scopes.query-handler";
import { listAccessCustomerProjects } from "@/server/workspace/access/query-handler/list-access-customer-projects.query-handler";
import { listRoleAssignmentOptions } from "@/server/workspace/access/query-handler/list-role-assignment-options.query-handler";
import { listWorkspaceMembers } from "@/server/workspace/access/query-handler/list-workspace-members.query-handler";
import { responsibilityAccessService } from "@/server/workspace/shared/services/responsibility-access-service";

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
  const canReadLineItemTemplates = can(actor, Permission.LineItemTemplatesRead);
  const canManageAccess = can(actor, Permission.MembersManage);
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
  const customerListWithValues = {
    ...customerList,
    rows: await Promise.all(
      customerList.rows.map(async (customer) => {
        const canReadProjectLineItems =
          can(actor, Permission.ProjectLineItemsRead) ||
          actor.customerPermissions
            .get(customer.id)
            ?.has(Permission.ProjectLineItemsRead) ||
          [...actor.projectPermissions.values()].some(
            (scope) =>
              scope.customerId === customer.id &&
              scope.permissions.has(Permission.ProjectLineItemsRead),
          );
        if (!canReadProjectLineItems) return customer;
        return {
          ...customer,
          projectLineItemValue: calculateProjectLineItemValue(
            await listProjectLineItemsByCustomer(customer.id, actor),
          ),
        };
      }),
    ),
  };
  const writableCustomerIds = new Set(
    customerList.rows
      .filter((row) =>
        canOn(actor, Permission.CustomersWrite, { customerId: row.id }),
      )
      .map((row) => row.id),
  );
  const cockpitProjects = cockpitCustomer
    ? await listCockpitProjectsByCustomer(cockpitCustomer.id, actor)
    : null;
  const projectLineItemsViewModel =
    cockpitCustomer && cockpitProjects
      ? await buildProjectLineItemsViewModel({
          actor,
          catalogHref: canReadLineItemTemplates
            ? crmLineItemTemplatesPathFor(activeLocale)
            : null,
          customerId: cockpitCustomer.id,
          projects: cockpitProjects,
        })
      : null;
  const customerAccessData =
    cockpitCustomer && canManageAccess
      ? await Promise.all([
          listCustomerAccessScopes(cockpitCustomer.id),
          listAccessCustomerProjects(cockpitCustomer.id),
          listWorkspaceMembers(),
          listRoleAssignmentOptions(),
          responsibilityAccessService.evaluate({
            customerId: cockpitCustomer.id,
            projectIds: cockpitProjects?.map((project) => project.id),
          }),
        ])
      : null;
  const rolesHref = buildSettingsTabHref(
    workspaceAreaPathFor(activeLocale, WorkspaceArea.Settings),
    SettingsTab.Roles,
  );
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
    <WorkspacePageShell pageId="crm">
      {canReadLineItemTemplates ? (
        <ButtonLink
          href={crmLineItemTemplatesPathFor(activeLocale)}
          linkComponent={Link}
          variant="ghost"
        >
          {getCrmLineItemTemplatesDictionary(activeLocale).shell.title}
        </ButtonLink>
      ) : null}
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
      {cockpitCustomer ? (
        <CustomerCockpitDialog
          accessContent={
            customerAccessData
              ? getCrmAccessDictionary(activeLocale)
              : undefined
          }
          accessMembers={customerAccessData?.[2]}
          accessProjects={customerAccessData?.[1]}
          accessRoles={customerAccessData?.[3]}
          accessScopes={customerAccessData?.[0]}
          customerOwnerMemberId={
            customerAccessData?.[4].targets.find(
              (target) => target.entityId === `customer:${cockpitCustomer.id}`,
            )?.ownerMemberId
          }
          customerOwnerHasAccess={
            customerAccessData
              ? !customerAccessData[4].inaccessibleEntityIds.has(
                  `customer:${cockpitCustomer.id}`,
                )
              : undefined
          }
          closeHref={cockpitCloseHref}
          content={getCrmCockpitDictionary(activeLocale)}
          customer={cockpitCustomer}
          canWriteProjects={canAnywhere(actor, Permission.ProjectsWrite)}
          locale={activeLocale}
          projectLineItems={projectLineItemsViewModel ?? undefined}
          projectLineItemsContent={
            projectLineItemsViewModel
              ? getCrmProjectLineItemsDictionary(activeLocale)
              : undefined
          }
          projects={cockpitProjects}
          projectOwnerHasAccess={
            customerAccessData && cockpitProjects
              ? Object.fromEntries(
                  cockpitProjects.map((project) => [
                    project.id,
                    !customerAccessData[4].inaccessibleEntityIds.has(
                      `project:${project.id}`,
                    ),
                  ]),
                )
              : undefined
          }
          permissionsContent={
            customerAccessData
              ? getSettingsPermissionsDictionary(activeLocale)
              : undefined
          }
          rolesHref={customerAccessData ? rolesHref : undefined}
        />
      ) : null}
    </WorkspacePageShell>
  );
}
