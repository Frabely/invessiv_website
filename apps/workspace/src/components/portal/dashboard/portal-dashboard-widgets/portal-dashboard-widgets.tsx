"use client";

import type { PortalServiceRequestsDictionary } from "@/common/contracts/portal/portal-service-requests-dictionary";
import { type ReactNode, useId } from "react";
import type { PortalCredentialsSummaryDto } from "@invessiv/common/contracts/portal/portal-credentials-summary.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalFilesOverviewDto } from "@invessiv/common/contracts/portal/portal-files-overview.dto";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";
import { WidgetGrid } from "@invessiv/ui";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalWidgetDefinition } from "@/common/contracts/portal/portal-widget-definition";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PortalDashboardEmptyState } from "../portal-dashboard-empty-state/portal-dashboard-empty-state";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import { PortalCompletedProjectsWidget } from "../widgets/portal-completed-projects-widget/portal-completed-projects-widget";
import { PortalContactWidget } from "../widgets/portal-contact-widget/portal-contact-widget";
import { PortalCredentialsWidget } from "../widgets/portal-credentials-widget/portal-credentials-widget";
import { PortalCustomerTasksWidget } from "../widgets/portal-customer-tasks-widget/portal-customer-tasks-widget";
import { PortalFeedbackWidget } from "../widgets/portal-feedback-widget/portal-feedback-widget";
import { PortalFilesWidget } from "../widgets/portal-files-widget/portal-files-widget";
import { PortalHoursWidget } from "../widgets/portal-hours-widget/portal-hours-widget";
import { PortalServiceRequestWidget } from "../widgets/portal-service-request-widget/portal-service-request-widget";
import { PortalOnboardingWidget } from "../widgets/portal-onboarding-widget/portal-onboarding-widget";
import { PortalOurTasksWidget } from "../widgets/portal-our-tasks-widget/portal-our-tasks-widget";
import { PortalProjectWidget } from "../widgets/portal-project-widget/portal-project-widget";
import { usePortalDashboardTasks } from "@/hooks/portal/use-portal-dashboard-tasks";
import type { PortalDashboardTaskActions } from "@/common/contracts/portal/portal-dashboard-task-actions";
export type PortalDashboardWidgetsProps = {
  cockpitHref: string | null;
  content: PortalDashboardDictionary;
  customerId: string;
  dashboard: PortalDashboardDto;
  credentials: PortalCredentialsSummaryDto | null;
  filesHref: string;
  filesOverview: PortalFilesOverviewDto | null;
  hours: PortalHoursDto | null;
  locale: Locale;
  messagesHref: string | null;
  onboarding: PortalOnboardingFormSummaryDto | null;
  onboardingCall: PortalOnboardingCallDto | null;
  services: PortalServicesDto | null;
  serviceRequestsContent: PortalServiceRequestsDictionary;
  today: string;
  widgets: readonly PortalWidgetDefinition[];
  taskActions: PortalDashboardTaskActions;
  onOpenAction: (widget: PortalWidgetKey) => void;
  onOpenCredentialsAction: (create: boolean) => void;
};
export function PortalDashboardWidgets({
  cockpitHref,
  content,
  customerId,
  dashboard,
  credentials,
  filesHref,
  filesOverview,
  hours,
  locale,
  messagesHref,
  onboarding,
  onboardingCall,
  services,
  serviceRequestsContent,
  today,
  widgets,
  taskActions,
  onOpenAction: openDialog,
  onOpenCredentialsAction: openCredentials,
}: PortalDashboardWidgetsProps) {
  const requestOwnerNoticeId = useId();
  const serviceOwnerNoticeId = useId();
  const ourTasks = dashboard.ourTasks;
  const selectedProject = dashboard.project;
  const isOwnerView = dashboard.capabilities.isOwnerView;
  const tasks = usePortalDashboardTasks(
    dashboard,
    content,
    taskActions,
    locale,
    today,
    cockpitHref,
  );
  const requestProjectId = tasks.requestProjectId;
  const slots: Partial<Record<PortalWidgetKey, ReactNode>> = {
    [PortalWidgetKey.Onboarding]: onboarding ? (
      <PortalOnboardingWidget
        call={onboardingCall}
        chatHref={messagesHref}
        content={content.widgets.onboarding}
        customerId={customerId}
        form={onboarding}
        locale={locale}
      />
    ) : null,
    [PortalWidgetKey.Project]: selectedProject ? (
      <PortalProjectWidget
        content={content.widgets.project}
        locale={locale}
        selectedProject={selectedProject}
      />
    ) : (
      <PortalDashboardEmptyState content={content.widgets.project} />
    ),
    [PortalWidgetKey.CustomerTasks]: (
      <PortalCustomerTasksWidget
        {...tasks.listProps}
        doneTasks={tasks.doneTasks}
        onOpenAction={() => openDialog(PortalWidgetKey.CustomerTasks)}
        openTasks={tasks.openTasks}
        ownerHintId={tasks.ownerNoticeId}
        ownerNotice={tasks.ownerNotice}
      />
    ),
    [PortalWidgetKey.OurTasks]: (
      <PortalOurTasksWidget
        content={content}
        locale={locale}
        onCreateAction={
          requestProjectId ? () => openDialog(PortalWidgetKey.OurTasks) : null
        }
        ownerNotice={
          isOwnerView && cockpitHref ? (
            <PortalOwnerNotice
              cockpitHref={cockpitHref}
              hint={content.widgets.ourTasks.ownerHint}
              id={requestOwnerNoticeId}
              linkLabel={content.widgets.ourTasks.ownerLink}
            />
          ) : null
        }
        tasks={ourTasks}
        today={today}
      />
    ),
    [PortalWidgetKey.Feedback]: (
      <PortalFeedbackWidget
        content={content.widgets.feedback}
        customerId={customerId}
        entry={dashboard.feedback}
        locale={locale}
      />
    ),
    [PortalWidgetKey.Hours]: hours ? (
      <PortalHoursWidget
        content={content.widgets.hours}
        hours={hours}
        onOpenAction={() => openDialog(PortalWidgetKey.Hours)}
        selectedProjectId={dashboard.selectedProjectId}
      />
    ) : null,
    [PortalWidgetKey.Contact]: dashboard.contact ? (
      <PortalContactWidget
        contact={dashboard.contact}
        content={content.widgets.contact}
      />
    ) : null,
    [PortalWidgetKey.Files]: (
      <PortalFilesWidget
        content={content.widgets.files}
        filesHref={filesHref}
        locale={locale}
        overview={filesOverview}
      />
    ),
    [PortalWidgetKey.Credentials]: credentials ? (
      <PortalCredentialsWidget
        content={content.widgets.credentials}
        onAddAction={credentials.canWrite ? () => openCredentials(true) : null}
        onOpenAction={() => openCredentials(false)}
        summary={credentials}
      />
    ) : null,
    [PortalWidgetKey.ServiceRequest]: services ? (
      <PortalServiceRequestWidget
        content={content.widgets.serviceRequest}
        onOpenAction={() => openDialog(PortalWidgetKey.ServiceRequest)}
        ownerNotice={
          isOwnerView && cockpitHref ? (
            <PortalOwnerNotice
              cockpitHref={cockpitHref}
              hint={content.widgets.serviceRequest.ownerHint}
              id={serviceOwnerNoticeId}
              linkLabel={content.widgets.serviceRequest.ownerLink}
            />
          ) : null
        }
        services={services}
        statusLabels={serviceRequestsContent.list.status}
      />
    ) : null,
    [PortalWidgetKey.CompletedProjects]: (
      <PortalCompletedProjectsWidget
        content={content.widgets.completedProjects}
        projects={dashboard.completedProjects}
      />
    ),
  };

  return (
    <WidgetGrid
      layout={widgets}
      slots={Object.fromEntries(
        widgets.map((entry) => [entry.key, slots[entry.key]]),
      )}
    />
  );
}
