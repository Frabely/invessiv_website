"use client";

import { type ReactNode, useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { faCirclePlus, faClock } from "@fortawesome/free-solid-svg-icons";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import type { PortalCredentialsSummaryDto } from "@invessiv/common/contracts/portal/portal-credentials-summary.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalFilesOverviewDto } from "@invessiv/common/contracts/portal/portal-files-overview.dto";
import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ChatDock, WidgetGrid } from "@invessiv/ui";
import type { PortalDashboardNavigationMode as PortalDashboardNavigationModeType } from "@/common/constants/portal/portal-dashboard-navigation-modes";
import { PortalDashboardNavigationMode } from "@/common/constants/portal/portal-dashboard-navigation-modes";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalWidgetDefinition } from "@/common/contracts/portal/portal-widget-definition";
import { buildPortalHref } from "@/common/patterns/portal/build-portal-href";
import {
  readPortalDashboardChat,
  readPortalDashboardWidget,
} from "@/common/patterns/portal/portal-dashboard-query";
import { buildPortalFeedbackPath } from "@/common/patterns/portal/portal-feedback-path";
import { describeUnreadBadge } from "@/common/patterns/crm/describe-unread-badge";
import type { Locale } from "@/config/i18n";
import { PortalConversation } from "@/components/portal/messages/portal-conversation/portal-conversation";
import { usePortalTaskCompletion } from "@/hooks/portal/use-portal-task-completion";
import type {
  PortalCredentialsDictionary,
  PortalDashboardDictionary,
  PortalFilesDictionary,
  PortalMessagesDictionary,
} from "@/i18n/dictionaries/portal";
import { PortalDashboardEmptyState } from "../portal-dashboard-empty-state/portal-dashboard-empty-state";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import { PortalTaskRequestDialog } from "../portal-task-request-dialog/portal-task-request-dialog";
import { PortalWidgetDialogHost } from "../portal-widget-dialog-host/portal-widget-dialog-host";
import { PortalCompletedProjectsWidget } from "../widgets/portal-completed-projects-widget/portal-completed-projects-widget";
import { PortalContactWidget } from "../widgets/portal-contact-widget/portal-contact-widget";
import { PortalCustomerTasksDialogContent } from "../widgets/portal-customer-tasks-widget/portal-customer-tasks-dialog-content";
import { PortalCredentialsDialog } from "@/components/portal/credentials/portal-credentials-dialog/portal-credentials-dialog";
import { PortalCredentialsWidget } from "../widgets/portal-credentials-widget/portal-credentials-widget";
import { PortalCustomerTasksWidget } from "../widgets/portal-customer-tasks-widget/portal-customer-tasks-widget";
import { PortalFeedbackWidget } from "../widgets/portal-feedback-widget/portal-feedback-widget";
import { PortalFilesWidget } from "../widgets/portal-files-widget/portal-files-widget";
import { PortalMockWidget } from "../widgets/portal-mock-widget/portal-mock-widget";
import { PortalOnboardingWidget } from "../widgets/portal-onboarding-widget/portal-onboarding-widget";
import { PortalOurTasksWidget } from "../widgets/portal-our-tasks-widget/portal-our-tasks-widget";
import { PortalProjectWidget } from "../widgets/portal-project-widget/portal-project-widget";
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
  locale: Locale;
  messagesContent: PortalMessagesDictionary;
  /** This dashboard with the chat dock open; null without `portal.messages.read`. */
  messagesHref?: string | null;
  /** The released form of the selected project, if visible to the reader. */
  onboarding: PortalOnboardingFormSummaryDto | null;
  /** The call of the widget's form once the team has reviewed it; null until then. */
  onboardingCall?: PortalOnboardingCallDto | null;
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
  locale,
  messagesContent,
  messagesHref = null,
  onboarding,
  onboardingCall = null,
  today,
  widgets,
  viewerUserId,
}: PortalDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dockOpen, setDockOpen] = useState(false);
  const dockId = useId();
  const ownerNoticeId = useId();
  const dialogOwnerNoticeId = useId();
  const requestOwnerNoticeId = useId();
  const [requestAnnouncement, setRequestAnnouncement] = useState("");
  // Which way the credentials dialog was entered; the URL only says that it is open.
  const [credentialsCreate, setCredentialsCreate] = useState(false);
  const completion = usePortalTaskCompletion(
    customerId,
    content.tasks.announce,
  );

  const visibleKeys = new Set(widgets.map((entry) => entry.key));
  const requestedWidget = readPortalDashboardWidget(searchParams);
  const openWidget =
    requestedWidget && visibleKeys.has(requestedWidget)
      ? requestedWidget
      : null;
  const chatRequested = readPortalDashboardChat(searchParams);
  const dockExpanded = dockOpen || chatRequested;
  const selectedProject = dashboard.project;
  const { canCompleteTasks, canCreateTasks, isOwnerView } =
    dashboard.capabilities;
  const requestProjectId = canCreateTasks ? dashboard.selectedProjectId : null;

  function navigate(
    change: Parameters<typeof buildPortalHref>[2],
    mode: PortalDashboardNavigationModeType,
  ) {
    const href = buildPortalHref(pathname, searchParams.toString(), change);
    router[mode](href, { scroll: false });
  }

  function setDockExpanded(expanded: boolean) {
    setDockOpen(expanded);
    if (!chatRequested) return;
    // The link's request is spent on the first toggle; dropping it needs no server roundtrip.
    window.history.replaceState(
      null,
      "",
      buildPortalHref(pathname, searchParams.toString(), { chat: null }),
    );
  }

  const openDialog = (widget: PortalWidgetKey) =>
    navigate({ widget }, PortalDashboardNavigationMode.Push);
  const closeDialog = () =>
    navigate({ widget: null }, PortalDashboardNavigationMode.Replace);
  const openCredentials = (create: boolean) => {
    setCredentialsCreate(create);
    openDialog(PortalWidgetKey.Credentials);
  };

  const ownerNotice = (id: string): ReactNode =>
    isOwnerView && cockpitHref ? (
      <PortalOwnerNotice
        cockpitHref={cockpitHref}
        hint={content.widgets.customerTasks.ownerHint}
        id={id}
        linkLabel={content.widgets.customerTasks.ownerLink}
      />
    ) : null;

  const openCustomerTasks = dashboard.customerTasks.filter(
    (task) => !task.done,
  );
  const doneCustomerTasks = dashboard.customerTasks.filter((task) => task.done);
  const taskListProps = {
    canComplete: canCompleteTasks,
    content,
    isDoneAction: completion.isDone,
    isOwnerView,
    isPendingAction: completion.isPending,
    locale,
    onToggleAction: (
      task: Parameters<typeof completion.toggle>[0],
      done: boolean,
    ) => {
      // One live region announces both flows; the newer event replaces the older one.
      setRequestAnnouncement("");
      void completion.toggle(task, done);
    },
    today,
  };
  const ourTasks = dashboard.ourTasks;

  const mockBadge = content.mock.badge;
  const mockDialog = (
    key: typeof PortalWidgetKey.Hours | typeof PortalWidgetKey.ServiceRequest,
    icon: Parameters<typeof PortalMockWidget>[0]["icon"],
  ) => (
    <PortalMockWidget
      badgeLabel={mockBadge}
      icon={icon}
      onOpenAction={() => openDialog(key)}
      openLabel={content.widgets[key].open}
      openMode={WidgetOpenMode.Dialog}
      teaser={content.widgets[key].teaser}
      title={content.widgets[key].title}
    />
  );

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
        feedbackHref={
          dashboard.feedback?.status
            ? buildPortalHref(
                buildPortalFeedbackPath({
                  locale,
                  customerId,
                  projectId: selectedProject.id,
                }),
                "",
                { project: selectedProject.id },
              )
            : null
        }
        feedbackLinkLabel={content.widgets.feedback.projectLink}
        locale={locale}
        selectedProject={selectedProject}
      />
    ) : (
      <PortalDashboardEmptyState content={content.widgets.project} />
    ),
    [PortalWidgetKey.CustomerTasks]: (
      <PortalCustomerTasksWidget
        {...taskListProps}
        doneTasks={doneCustomerTasks}
        onOpenAction={() => openDialog(PortalWidgetKey.CustomerTasks)}
        openTasks={openCustomerTasks}
        ownerHintId={ownerNoticeId}
        ownerNotice={ownerNotice(ownerNoticeId)}
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
    [PortalWidgetKey.Hours]: mockDialog(PortalWidgetKey.Hours, faClock),
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
    [PortalWidgetKey.ServiceRequest]: mockDialog(
      PortalWidgetKey.ServiceRequest,
      faCirclePlus,
    ),
    [PortalWidgetKey.CompletedProjects]: (
      <PortalCompletedProjectsWidget
        content={content.widgets.completedProjects}
        projects={dashboard.completedProjects}
      />
    ),
  };

  return (
    <div className={styles.frame}>
      <div className={styles.content}>
        <WidgetGrid
          layout={widgets}
          slots={Object.fromEntries(
            widgets.map((entry) => [entry.key, slots[entry.key]]),
          )}
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
            expanded={dockExpanded}
            onExpandedChangeAction={setDockExpanded}
            overlay
            unreadCount={conversation.unreadCount}
          >
            <PortalConversation
              active={dockExpanded}
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
      <PortalWidgetDialogHost
        content={content}
        credentialsDialog={
          credentials ? (
            <PortalCredentialsDialog
              cockpitHref={cockpitHref}
              content={credentialsContent}
              customerId={customerId}
              locale={locale}
              onCloseAction={closeDialog}
              onSavedAction={setRequestAnnouncement}
              startWithCreate={credentialsCreate && credentials.canWrite}
            />
          ) : null
        }
        customerTasksContent={
          <PortalCustomerTasksDialogContent
            {...taskListProps}
            doneTasks={doneCustomerTasks}
            openTasks={openCustomerTasks}
            ownerHintId={dialogOwnerNoticeId}
            ownerNotice={ownerNotice(dialogOwnerNoticeId)}
          />
        }
        onCloseAction={closeDialog}
        taskRequestDialog={
          requestProjectId ? (
            <PortalTaskRequestDialog
              content={content.tasks.request}
              customerId={customerId}
              onCloseAction={closeDialog}
              onCreatedAction={(title) => {
                setRequestAnnouncement(
                  formatMessage(content.tasks.announce.requested, {
                    name: title,
                  }),
                );
                closeDialog();
                router.refresh();
              }}
              projectId={requestProjectId}
              projectTitle={selectedProject?.title ?? null}
              today={today}
            />
          ) : null
        }
        widgetKey={openWidget}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {requestAnnouncement || completion.announcement}
      </p>
    </div>
  );
}
