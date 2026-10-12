"use client";

import type { PortalServiceRequestsDictionary } from "@/common/contracts/portal/portal-service-requests-dictionary";
import type { PortalCredentialsSummaryDto } from "@invessiv/common/contracts/portal/portal-credentials-summary.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { Locale } from "@/config/i18n";
import type {
  PortalCredentialsDictionary,
  PortalDashboardDictionary,
  PortalHoursDictionary,
} from "@/i18n/dictionaries/portal";
import { PortalTaskRequestDialog } from "../portal-task-request-dialog/portal-task-request-dialog";
import { PortalWidgetDialogHost } from "../portal-widget-dialog-host/portal-widget-dialog-host";
import { PortalCustomerTasksDialogContent } from "../widgets/portal-customer-tasks-widget/portal-customer-tasks-dialog-content";
import { PortalCredentialsDialog } from "@/components/portal/credentials/portal-credentials-dialog/portal-credentials-dialog";
import { PortalHoursDialog } from "@/components/portal/hours/portal-hours-dialog/portal-hours-dialog";
import { PortalServiceRequestDialog } from "@/components/portal/service-requests/portal-service-request-dialog/portal-service-request-dialog";
import { usePortalDashboardTasks } from "@/hooks/portal/use-portal-dashboard-tasks";
import type { PortalDashboardTaskActions } from "@/common/contracts/portal/portal-dashboard-task-actions";
import type { PortalDashboardNavigation } from "@/common/contracts/portal/portal-dashboard-navigation";
export type PortalDashboardDialogsProps = {
  cockpitHref: string | null;
  content: PortalDashboardDictionary;
  customerId: string;
  dashboard: PortalDashboardDto;
  credentials: PortalCredentialsSummaryDto | null;
  credentialsContent: PortalCredentialsDictionary;
  hours: PortalHoursDto | null;
  hoursContent: PortalHoursDictionary;
  locale: Locale;
  services: PortalServicesDto | null;
  serviceRequestsContent: PortalServiceRequestsDictionary;
  today: string;
  taskActions: PortalDashboardTaskActions;
  navigation: PortalDashboardNavigation;
  onAnnounceAction: (message: string) => void;
};
export function PortalDashboardDialogs({
  cockpitHref,
  content,
  customerId,
  credentials,
  credentialsContent,
  dashboard,
  hours,
  hoursContent,
  locale,
  services,
  serviceRequestsContent,
  today,
  taskActions,
  navigation,
  onAnnounceAction,
}: PortalDashboardDialogsProps) {
  const selectedProject = dashboard.project;

  const tasks = usePortalDashboardTasks(
    dashboard,
    content,
    taskActions,
    locale,
    today,
    cockpitHref,
  );
  const requestProjectId = tasks.requestProjectId;
  return (
    <PortalWidgetDialogHost
      content={content}
      credentialsDialog={
        credentials ? (
          <PortalCredentialsDialog
            cockpitHref={cockpitHref}
            content={credentialsContent}
            customerId={customerId}
            locale={locale}
            onCloseAction={navigation.closeDialog}
            onSavedAction={onAnnounceAction}
            startWithCreate={
              navigation.credentialsCreate && credentials.canWrite
            }
          />
        ) : null
      }
      hoursDialog={
        hours ? (
          <PortalHoursDialog
            content={hoursContent}
            customerId={customerId}
            hours={hours}
            locale={locale}
            onCloseAction={navigation.closeDialog}
          />
        ) : null
      }
      customerTasksContent={
        <PortalCustomerTasksDialogContent
          {...tasks.listProps}
          doneTasks={tasks.doneTasks}
          openTasks={tasks.openTasks}
          ownerHintId={tasks.ownerNoticeId}
          ownerNotice={tasks.ownerNotice}
        />
      }
      onCloseAction={navigation.closeDialog}
      serviceRequestDialog={
        services ? (
          <PortalServiceRequestDialog
            cockpitHref={cockpitHref}
            content={serviceRequestsContent}
            customerId={customerId}
            initialSelection={navigation.initialService}
            locale={locale}
            onChangedAction={(announcement) => {
              onAnnounceAction(announcement);
              navigation.refreshServices();
            }}
            onCloseAction={navigation.closeDialog}
            onSelectionChangeAction={navigation.selectService}
            selectedProjectId={dashboard.selectedProjectId}
            services={services}
          />
        ) : null
      }
      taskRequestDialog={
        requestProjectId ? (
          <PortalTaskRequestDialog
            content={content.tasks.request}
            customerId={customerId}
            onCloseAction={navigation.closeDialog}
            onCreatedAction={(title) => {
              onAnnounceAction(
                formatMessage(content.tasks.announce.requested, {
                  name: title,
                }),
              );
              navigation.finishTaskRequest();
            }}
            projectId={requestProjectId}
            projectTitle={selectedProject?.title ?? null}
            today={today}
          />
        ) : null
      }
      widgetKey={navigation.openWidget}
    />
  );
}
