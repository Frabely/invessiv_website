import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Link from "next/link";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { ButtonLink } from "@invessiv/ui";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { ServiceTemplateFormDialogMode } from "@/common/constants/crm/forms/service-template-form-dialog-modes";
import {
  buildServiceTemplateCreateHref,
  buildServiceTemplateDialogCloseHref,
  buildServiceTemplateListHref,
  readServiceTemplateDialogRequest,
  readServiceTemplateIncludeArchived,
} from "@/common/patterns/crm/service-template-dialog-query";
import { ServiceTemplateFormDialog } from "@/components/workspace/crm/services/service-template-form-dialog/service-template-form-dialog";
import { ServiceTemplatesList } from "@/components/workspace/crm/services/service-templates-list/service-templates-list";
import { ServiceTemplatesPageHeader } from "@/components/workspace/crm/services/service-templates-page-header/service-templates-page-header";
import { WorkspacePageShell } from "@/components/workspace/workspace-page-shell/workspace-page-shell";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { crmServicesPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { getCrmServicesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { requireWorkspacePermission } from "@/lib/auth/permissions";
import { listServiceTemplates } from "@/server/workspace/crm/query-handler/list-service-templates.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ServiceTemplatesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: ServiceTemplatesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }
  const meta = getCrmServicesDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function ServiceTemplatesPage({
  params,
  searchParams,
}: ServiceTemplatesPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  // The layout is not re-rendered on search param changes, so the page gates its own data.
  const actor = await requireWorkspacePermission(
    locale,
    Permission.ServicesRead,
  );
  const activeLocale: Locale = locale;
  const resolvedSearchParams = await searchParams;
  const includeArchived =
    readServiceTemplateIncludeArchived(resolvedSearchParams);
  const basePath = crmServicesPathFor(activeLocale);
  const canWrite = can(actor, Permission.ServicesWrite);
  const dialogRequest = canWrite
    ? readServiceTemplateDialogRequest(resolvedSearchParams)
    : null;

  const list = await listServiceTemplates({ includeArchived });
  const editServiceTemplate =
    dialogRequest?.mode === ServiceTemplateFormDialogMode.Edit
      ? (list.rows.find((row) => row.id === dialogRequest.serviceTemplateId) ??
        null)
      : null;
  // An unknown edit id opens nothing; it is not an error.
  const showDialog =
    dialogRequest?.mode === ServiceTemplateFormDialogMode.Create ||
    editServiceTemplate !== null;

  const content = getCrmServicesDictionary(activeLocale);
  const createHref = canWrite
    ? buildServiceTemplateCreateHref(basePath, includeArchived)
    : null;
  const closeHref = buildServiceTemplateDialogCloseHref(
    basePath,
    includeArchived,
  );
  const toggleArchivedHref = buildServiceTemplateListHref(
    basePath,
    !includeArchived,
  );

  return (
    <WorkspacePageShell pageId="crm-services">
      <ButtonLink
        href={workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm)}
        linkComponent={Link}
        variant="ghost"
      >
        {content.shell.backToCustomers}
      </ButtonLink>
      <ServiceTemplatesPageHeader
        archivedToggleHref={toggleArchivedHref}
        content={content}
        createHref={createHref}
        includeArchived={includeArchived}
      />
      <ServiceTemplatesList
        basePath={basePath}
        canWrite={canWrite}
        content={content}
        createHref={createHref}
        hasServiceTemplates={list.hasServiceTemplates}
        includeArchived={includeArchived}
        locale={activeLocale}
        serviceTemplates={list.rows}
        toggleArchivedHref={toggleArchivedHref}
      />
      {showDialog ? (
        <ServiceTemplateFormDialog
          closeHref={closeHref}
          content={content}
          key={editServiceTemplate?.id ?? ServiceTemplateFormDialogMode.Create}
          locale={activeLocale}
          serviceTemplate={editServiceTemplate}
        />
      ) : null}
    </WorkspacePageShell>
  );
}
