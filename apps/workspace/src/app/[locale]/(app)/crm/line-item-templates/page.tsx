import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { LineItemTemplateFormDialogMode } from "@/common/constants/crm/forms/line-item-template-form-dialog-modes";
import {
  buildLineItemTemplateCreateHref,
  buildLineItemTemplateDialogCloseHref,
  readLineItemTemplateDialogRequest,
} from "@/common/patterns/crm/line-item-template-dialog-query";
import { parseLineItemTemplateListFilters } from "@/common/patterns/crm/line-item-template-list-search-params";
import {
  buildLineItemTemplateListHref,
  buildLineItemTemplateListQueryString,
} from "@/lib/workspace/crm/line-item-template-list-query-string";
import { LineItemTemplateFormDialog } from "@/components/workspace/crm/line-item-templates/line-item-template-form-dialog/line-item-template-form-dialog";
import { LineItemTemplatesList } from "@/components/workspace/crm/line-item-templates/line-item-templates-list/line-item-templates-list";
import { LineItemTemplatesPageHeader } from "@/components/workspace/crm/line-item-templates/line-item-templates-page-header/line-item-templates-page-header";
import { WorkspaceScrollablePageShell } from "@/components/workspace/shared/workspace-scrollable-page-shell/workspace-scrollable-page-shell";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { crmLineItemTemplatesPathFor } from "@/lib/auth/routes";
import { getCrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspacePermission } from "@/lib/auth/permissions";
import { listLineItemTemplates } from "@/server/workspace/crm/query-handler/list-line-item-templates.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LineItemTemplatesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: LineItemTemplatesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getCrmLineItemTemplatesDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function LineItemTemplatesPage({
  params,
  searchParams,
}: LineItemTemplatesPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // The layout is not re-rendered on search param changes, so the page gates its own data.
  const actor = await requireWorkspacePermission(
    locale,
    Permission.LineItemTemplatesRead,
  );
  const activeLocale: Locale = locale;
  const resolvedSearchParams = await searchParams;
  const requestedFilters =
    parseLineItemTemplateListFilters(resolvedSearchParams);
  const basePath = crmLineItemTemplatesPathFor(activeLocale);
  const canWrite = can(actor, Permission.LineItemTemplatesWrite);
  const dialogRequest = canWrite
    ? readLineItemTemplateDialogRequest(resolvedSearchParams)
    : null;

  const list = await listLineItemTemplates(requestedFilters);
  const editLineItemTemplate =
    dialogRequest?.mode === LineItemTemplateFormDialogMode.Edit
      ? (list.rows.find((row) => row.id === dialogRequest.lineItemTemplateId) ??
        null)
      : null;
  // An unknown edit id opens nothing; it is not an error.
  const showDialog =
    dialogRequest?.mode === LineItemTemplateFormDialogMode.Create ||
    editLineItemTemplate !== null;

  const content = getCrmLineItemTemplatesDictionary(activeLocale);
  const filters = { ...requestedFilters, page: list.page };
  const queryString = buildLineItemTemplateListQueryString(filters);
  const createHref = canWrite
    ? buildLineItemTemplateCreateHref(basePath, queryString)
    : null;
  const closeHref = buildLineItemTemplateDialogCloseHref(basePath, queryString);
  const toggleArchivedHref = buildLineItemTemplateListHref(basePath, {
    ...filters,
    includeArchived: !filters.includeArchived,
    page: 1,
  });

  return (
    <WorkspaceScrollablePageShell pageId="crm-services">
      <LineItemTemplatesPageHeader
        archivedToggleHref={toggleArchivedHref}
        content={content}
        createHref={createHref}
        includeArchived={filters.includeArchived}
      />
      <LineItemTemplatesList
        basePath={basePath}
        canWrite={canWrite}
        content={content}
        createHref={createHref}
        list={list}
        locale={activeLocale}
        queryString={queryString}
        toggleArchivedHref={toggleArchivedHref}
      />
      {showDialog ? (
        <LineItemTemplateFormDialog
          closeHref={closeHref}
          content={content}
          key={
            editLineItemTemplate?.id ?? LineItemTemplateFormDialogMode.Create
          }
          locale={activeLocale}
          lineItemTemplate={editLineItemTemplate}
        />
      ) : null}
    </WorkspaceScrollablePageShell>
  );
}
