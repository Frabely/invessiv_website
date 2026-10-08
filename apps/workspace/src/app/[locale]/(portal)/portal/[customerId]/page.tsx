import type { Metadata } from "next";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { listVisiblePortalWidgets } from "@/common/patterns/portal/list-visible-portal-widgets";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";
import { PortalDashboard } from "@/components/portal/dashboard/portal-dashboard/portal-dashboard";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getPortalCredentialsDictionary,
  getPortalDashboardDictionary,
  getPortalFilesDictionary,
  getPortalMessagesDictionary,
} from "@/i18n/dictionaries/portal";
import { portalPathFor, workspaceAreaPathFor } from "@/lib/auth/routes";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import { DASHBOARD_FILES_PREVIEW_SIZE } from "@/common/constants/portal/portal-files-limits";
import { PortalSection } from "@/common/constants/portal/portal-sections";
import { listPortalFiles } from "@/server/portal/query-handler/list-portal-files.query-handler";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { getPortalCredentialsSummary } from "@/server/portal/query-handler/get-portal-credentials-summary.query-handler";
import { getPortalConversation } from "@/server/portal/query-handler/get-portal-conversation.query-handler";
import { getPortalDashboard } from "@/server/portal/query-handler/get-portal-dashboard.query-handler";
import { getPortalOnboardingCall } from "@/server/portal/query-handler/get-portal-onboarding-call.query-handler";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { getPortalOnboardingWidgetForm } from "@/server/portal/query-handler/get-portal-onboarding-widget-form.query-handler";
import { PortalDashboardQueryParam } from "@/common/constants/portal/portal-dashboard-query-params";
import { buildPortalHref } from "@/common/patterns/portal/build-portal-href";
import { selectPortalCurrentProject } from "@/common/patterns/portal/select-portal-current-project";
import { listPortalCurrentProjects } from "@/server/portal/query-handler/list-portal-current-projects.query-handler";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PortalCustomerPageProps = {
  params: Promise<{ locale: string; customerId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PortalCustomerPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return {};
  }

  const meta = getPortalDashboardDictionary(locale).meta;
  return {
    title: meta.title,
    description: meta.description,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function PortalCustomerPage({
  params,
  searchParams,
}: PortalCustomerPageProps) {
  const { locale, customerId } = await params;
  const activeLocale = locale as Locale;
  const reader = await requirePortalReader(
    activeLocale,
    customerId.toLowerCase(),
  );
  const canReadProjects = portalCanOn.forReader(
    reader,
    Permission.PortalProjectsRead,
    { customerId: reader.customerId },
  );
  const today = taskDueStateService.businessToday();
  const projectParam = (await searchParams)?.[
    PortalDashboardQueryParam.Project
  ];
  // The layout already read this list in the same render, so selecting here costs no query and
  // lets everything below load at once.
  const selectedProjectId =
    selectPortalCurrentProject(
      await listPortalCurrentProjects(reader),
      typeof projectParam === "string" ? projectParam : null,
    )?.id ?? null;
  // Asked up front: credentials are only counted when their widget is shown to this reader.
  const showsCredentials = listVisiblePortalWidgets(
    reader.permissions,
    new Set(),
  ).some((entry) => entry.key === PortalWidgetKey.Credentials);
  const [
    dashboard,
    conversationResult,
    fromUs,
    fromYou,
    widgetForm,
    credentials,
  ] = await Promise.all([
    getPortalDashboard(reader, today, selectedProjectId),
    getPortalConversation(reader, null),
    listPortalFiles(reader, {
      origin: PortalFileOrigin.FromUs,
      pageSize: DASHBOARD_FILES_PREVIEW_SIZE,
      projectId: canReadProjects ? (selectedProjectId ?? undefined) : undefined,
    }),
    listPortalFiles(reader, {
      origin: PortalFileOrigin.FromYou,
      pageSize: DASHBOARD_FILES_PREVIEW_SIZE,
      projectId: canReadProjects ? (selectedProjectId ?? undefined) : undefined,
    }),
    // Without a current project, the onboarding widget has no form to show.
    selectedProjectId
      ? getPortalOnboardingWidgetForm(reader, selectedProjectId)
      : null,
    showsCredentials ? getPortalCredentialsSummary(reader) : null,
  ]);
  const onboardingCall = widgetForm
    ? await getPortalOnboardingCall(reader, widgetForm.id)
    : null;
  const content = getPortalDashboardDictionary(activeLocale);
  const keysWithContent = new Set<PortalWidgetKey>([
    PortalWidgetKey.Project,
    PortalWidgetKey.CustomerTasks,
    PortalWidgetKey.OurTasks,
  ]);
  if (dashboard.contact) keysWithContent.add(PortalWidgetKey.Contact);
  if (dashboard.completedProjects.length > 0)
    keysWithContent.add(PortalWidgetKey.CompletedProjects);
  if (widgetForm) keysWithContent.add(PortalWidgetKey.Onboarding);

  return (
    <>
      <h1 className="sr-only">
        {formatMessage(content.page.heading, {
          company: dashboard.customer.displayName,
        })}
      </h1>
      <PortalDashboard
        cockpitHref={
          dashboard.capabilities.isOwnerView
            ? buildCustomerCockpitHref(
                workspaceAreaPathFor(activeLocale, WorkspaceArea.Crm),
                reader.customerId,
              )
            : null
        }
        content={content}
        credentials={credentials}
        credentialsContent={getPortalCredentialsDictionary(activeLocale)}
        conversation={
          conversationResult.ok ? conversationResult.conversation : null
        }
        customerId={reader.customerId}
        dashboard={dashboard}
        filesHref={buildPortalHref(
          portalPathFor(activeLocale, reader.customerId, PortalSection.Files),
          "",
          { project: canReadProjects ? selectedProjectId : null },
        )}
        filesContent={getPortalFilesDictionary(activeLocale)}
        filesOverview={
          fromUs.ok && fromYou.ok
            ? { fromUs: fromUs.value, fromYou: fromYou.value }
            : null
        }
        key={reader.customerId}
        locale={activeLocale}
        messagesContent={getPortalMessagesDictionary(activeLocale)}
        messagesHref={
          portalCanOn.forReader(reader, Permission.PortalMessagesRead, {
            customerId: reader.customerId,
          })
            ? buildPortalHref(
                portalPathFor(
                  activeLocale,
                  reader.customerId,
                  PortalSection.Messages,
                ),
                "",
                { project: selectedProjectId },
              )
            : null
        }
        onboarding={widgetForm}
        onboardingCall={onboardingCall}
        today={today}
        viewerUserId={reader.userId}
        widgets={listVisiblePortalWidgets(reader.permissions, keysWithContent)}
      />
    </>
  );
}
