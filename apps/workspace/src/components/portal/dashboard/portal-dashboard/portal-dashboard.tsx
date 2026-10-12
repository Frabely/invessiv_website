"use client";

import type { PortalServiceRequestsDictionary } from "@/common/contracts/portal/portal-service-requests-dictionary";
import { useId, useState } from "react";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import type { PortalCredentialsSummaryDto } from "@invessiv/common/contracts/portal/portal-credentials-summary.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalFilesOverviewDto } from "@invessiv/common/contracts/portal/portal-files-overview.dto";
import type { PortalHoursDto } from "@invessiv/common/contracts/portal/portal-hours.dto";
import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";
import { ChatDock } from "@invessiv/ui";
import type { PortalWidgetDefinition } from "@/common/contracts/portal/portal-widget-definition";
import { describeUnreadBadge } from "@/common/patterns/crm/describe-unread-badge";
import type { Locale } from "@/config/i18n";
import { PortalConversation } from "@/components/portal/messages/portal-conversation/portal-conversation";
import { usePortalTaskCompletion } from "@/hooks/portal/use-portal-task-completion";
import type {
  PortalCredentialsDictionary,
  PortalDashboardDictionary,
  PortalFilesDictionary,
  PortalHoursDictionary,
  PortalMessagesDictionary,
} from "@/i18n/dictionaries/portal";
import { usePortalDashboardNavigation } from "@/hooks/portal/use-portal-dashboard-navigation";
import type { PortalDashboardTaskActions } from "@/common/contracts/portal/portal-dashboard-task-actions";
import { PortalDashboardWidgets } from "../portal-dashboard-widgets/portal-dashboard-widgets";
import { PortalDashboardDialogs } from "../portal-dashboard-dialogs/portal-dashboard-dialogs";
import styles from "./portal-dashboard.module.css";

export type PortalDashboardProps = {
  /** Cockpit link for the owner view's disabled actions; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalDashboardDictionary;
  /** Null without `portal.messages.read`; the chat dock is then not rendered at all. */
  conversation: PortalConversationDto | null;
  customerId: string;
  dashboard: PortalDashboardDto;
  /** What the credentials widget may show and offer; null without `portal.credentials.read`. */
  credentials?: PortalCredentialsSummaryDto | null;
  /** Texts of the credentials dialog the widget opens. */
  credentialsContent: PortalCredentialsDictionary;
  /** Files page of this customer, for the files widget. */
  filesHref: string;
  /** Null without `portal.files.read`; the files widget is then not rendered. */
  filesOverview: PortalFilesOverviewDto | null;
  /** Upload labels and file errors for attachments in the chat dock. */
  filesContent: PortalFilesDictionary;
  /** Balance and purchases; null without `portal.hours.read` or without any hours to show. */
  hours?: PortalHoursDto | null;
  /** Texts of the hours dialog the widget opens. */
  hoursContent: PortalHoursDictionary;
  locale: Locale;
  messagesContent: PortalMessagesDictionary;
  /** This dashboard with the chat dock open; null without `portal.messages.read`. */
  messagesHref?: string | null;
  /** The released form of the selected project, if visible to the reader. */
  onboarding: PortalOnboardingFormSummaryDto | null;
  /** The call of the widget's form once the team has reviewed it; null until then. */
  onboardingCall?: PortalOnboardingCallDto | null;
  /** Catalog, project options and own requests; null without `portal.services.read`. */
  services?: PortalServicesDto | null;
  /** Texts of the service request dialog the widget opens. */
  serviceRequestsContent: PortalServiceRequestsDictionary;
  /** Business day (`YYYY-MM-DD`) decided once on the server. */
  today: string;
  /** Already filtered on the server by permission and content. */
  widgets: readonly PortalWidgetDefinition[];
  /** Scopes locally kept drafts to the signed-in user. */
  viewerUserId: string;
};

/**
 * Orchestrates the widget grid, the dialog named in `?widget` and the chat dock, which a link can
 * open with `?chat=open`; the project is selected on the server. Mount it with `key={customerId}` so no client state crosses companies.
 */
export function PortalDashboard({
  cockpitHref,
  content,
  conversation,
  customerId,
  credentials = null,
  credentialsContent,
  dashboard,
  filesHref,
  filesOverview,
  filesContent,
  hours = null,
  hoursContent,
  locale,
  messagesContent,
  messagesHref = null,
  onboarding,
  onboardingCall = null,
  services = null,
  serviceRequestsContent,
  today,
  widgets,
  viewerUserId,
}: PortalDashboardProps) {
  const navigation = usePortalDashboardNavigation(widgets);
  const dockId = useId();
  const [requestAnnouncement, setRequestAnnouncement] = useState("");
  const completion = usePortalTaskCompletion(
    customerId,
    content.tasks.announce,
  );
  const taskActions: PortalDashboardTaskActions = {
    isDoneAction: completion.isDone,
    isPendingAction: completion.isPending,
    onToggleAction: (task, done) => {
      // One live region announces both flows; the newer event replaces the older one.
      setRequestAnnouncement("");
      void completion.toggle(task, done);
    },
  };

  return (
    <div className={styles.frame}>
      <div className={styles.content}>
        <PortalDashboardWidgets
          cockpitHref={cockpitHref}
          content={content}
          customerId={customerId}
          dashboard={dashboard}
          credentials={credentials}
          filesHref={filesHref}
          filesOverview={filesOverview}
          hours={hours}
          locale={locale}
          messagesHref={messagesHref}
          onboarding={onboarding}
          onboardingCall={onboardingCall}
          services={services}
          serviceRequestsContent={serviceRequestsContent}
          today={today}
          widgets={widgets}
          taskActions={taskActions}
          onOpenAction={navigation.openDialog}
          onOpenCredentialsAction={navigation.openCredentials}
        />
      </div>
      {conversation ? (
        <div
          className={styles.dock}
          data-owner-view={cockpitHref ? "true" : undefined}
          data-portal-dock
          id={dockId}
        >
          <ChatDock
            badgeLabel={describeUnreadBadge(
              conversation.unreadCount,
              messagesContent.dock.unread,
            )}
            className={styles.chat}
            content={content.chat}
            expanded={navigation.dockExpanded}
            onExpandedChangeAction={navigation.setDockExpanded}
            overlay
            unreadCount={conversation.unreadCount}
          >
            <PortalConversation
              active={navigation.dockExpanded}
              cockpitHref={cockpitHref}
              content={messagesContent}
              customerId={customerId}
              filesContent={filesContent}
              initialConversation={conversation}
              locale={locale}
              viewerUserId={viewerUserId}
            />
          </ChatDock>
        </div>
      ) : null}
      <PortalDashboardDialogs
        cockpitHref={cockpitHref}
        content={content}
        customerId={customerId}
        credentials={credentials}
        credentialsContent={credentialsContent}
        dashboard={dashboard}
        hours={hours}
        hoursContent={hoursContent}
        locale={locale}
        services={services}
        serviceRequestsContent={serviceRequestsContent}
        today={today}
        taskActions={taskActions}
        navigation={navigation}
        onAnnounceAction={setRequestAnnouncement}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {requestAnnouncement || completion.announcement}
      </p>
    </div>
  );
}
