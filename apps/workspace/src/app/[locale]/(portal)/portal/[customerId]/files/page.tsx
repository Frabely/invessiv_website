import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { PortalFilesQueryParam } from "@/common/constants/portal/portal-files-query-params";
import { PortalDashboardQueryParam } from "@/common/constants/portal/portal-dashboard-query-params";
import { buildPortalHref } from "@/common/patterns/portal/build-portal-href";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { readPortalFilesTab } from "@/common/patterns/portal/portal-files-tab";
import { PortalFilesView } from "@/components/portal/files/portal-files-view/portal-files-view";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import { getPortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { portalPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { listPortalFileProjects } from "@/server/portal/query-handler/list-portal-file-projects.query-handler";
import { listPortalFiles } from "@/server/portal/query-handler/list-portal-files.query-handler";
import { selectPortalCurrentProject } from "@/common/patterns/portal/select-portal-current-project";
import { listPortalCurrentProjects } from "@/server/portal/query-handler/list-portal-current-projects.query-handler";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PortalFilesPageProps = {
  params: Promise<{ locale: string; customerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PortalFilesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) return {};

  const meta = getPortalFilesDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PortalFilesPage({
  params,
  searchParams,
}: PortalFilesPageProps) {
  const { locale, customerId } = await params;
  const activeLocale = locale as Locale;
  const reader = await requirePortalReader(
    activeLocale,
    customerId.toLowerCase(),
  );
  const query = await searchParams;
  const tabParam = query[PortalFilesQueryParam.Tab];
  const tab = readPortalFilesTab(
    typeof tabParam === "string" ? tabParam : null,
  );
  const [projects, currentProjects] = await Promise.all([
    listPortalFileProjects(reader),
    listPortalCurrentProjects(reader),
  ]);
  const projectParam = query[PortalDashboardQueryParam.Project];
  const requestedProjectId =
    typeof projectParam === "string" ? projectParam : null;
  const selectableFileProjects = currentProjects.filter((current) =>
    projects.some((project) => project.id === current.id),
  );
  const selectedProjectId =
    (requestedProjectId &&
      projects.find((project) => project.id === requestedProjectId)?.id) ||
    selectPortalCurrentProject(selectableFileProjects, null)?.id ||
    null;
  const allProjects = query[PortalFilesQueryParam.Scope] === "all";
  const page = await listPortalFiles(reader, {
    origin: tab,
    projectId: allProjects ? undefined : (selectedProjectId ?? undefined),
  });
  if (!page.ok) notFound();
  const isOwnerView = isPortalOwnerView(reader);

  return (
    <PortalFilesView
      dashboardHref={buildPortalHref(
        portalPathFor(activeLocale, reader.customerId),
        "",
        { project: selectedProjectId },
      )}
      canUpload={
        !isOwnerView &&
        portalCanOn.forReader(reader, Permission.PortalFilesWrite, {
          customerId: reader.customerId,
        })
      }
      cockpitHref={
        isOwnerView
          ? buildCustomerCockpitHref(
              workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm),
              reader.customerId,
            )
          : null
      }
      content={getPortalFilesDictionary(activeLocale)}
      customerId={reader.customerId}
      initialPage={page.value}
      initialTab={tab}
      key={reader.customerId}
      locale={activeLocale}
      projects={projects}
      selectedProjectId={selectedProjectId}
      allProjects={allProjects}
    />
  );
}
