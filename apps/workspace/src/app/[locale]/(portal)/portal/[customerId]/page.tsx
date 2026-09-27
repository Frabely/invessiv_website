import type { Metadata } from "next";
import { WorkspaceArea } from "@/common/constants/auth/workspace-areas";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { buildCustomerCockpitHref } from "@/common/patterns/crm/customer-dialog-query";
import { listVisiblePortalWidgets } from "@/common/patterns/portal/list-visible-portal-widgets";
import { taskDueStateService } from "@/common/patterns/tasks/task-due-state";
import { PortalDashboard } from "@/components/portal/dashboard/portal-dashboard/portal-dashboard";
import { isSupportedLocale, type Locale } from "@/config/i18n";
import {
  getPortalDashboardDictionary,
  getPortalMessagesDictionary,
} from "@/i18n/dictionaries/portal";
import { workspaceAreaPathFor } from "@/lib/auth/routes";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { requirePortalReader } from "@/server/portal/auth/require-portal-reader";
import { getPortalConversation } from "@/server/portal/query-handler/get-portal-conversation.query-handler";
import { getPortalDashboard } from "@/server/portal/query-handler/get-portal-dashboard.query-handler";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PortalCustomerPageProps = {
  params: Promise<{ locale: string; customerId: string }>;
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
}: PortalCustomerPageProps) {
  const { locale, customerId } = await params;
  const activeLocale = locale as Locale;
  const reader = await requirePortalReader(
    activeLocale,
    customerId.toLowerCase(),
  );
  const today = taskDueStateService.businessToday();
  const [dashboard, conversation] = await Promise.all([
    getPortalDashboard(reader, today),
    getPortalConversation(reader, null),
  ]);
  const content = getPortalDashboardDictionary(activeLocale);
  const keysWithContent = new Set<PortalWidgetKey>([
    PortalWidgetKey.Project,
    PortalWidgetKey.CustomerTasks,
    PortalWidgetKey.OurTasks,
  ]);
  if (dashboard.contact) keysWithContent.add(PortalWidgetKey.Contact);
  if (dashboard.completedProjects.length > 0)
    keysWithContent.add(PortalWidgetKey.CompletedProjects);

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
        conversation={conversation}
        customerId={reader.customerId}
        dashboard={dashboard}
        key={reader.customerId}
        locale={activeLocale}
        messagesContent={getPortalMessagesDictionary(activeLocale)}
        today={today}
        viewerUserId={reader.userId}
        widgets={listVisiblePortalWidgets(reader.permissions, keysWithContent)}
      />
    </>
  );
}
