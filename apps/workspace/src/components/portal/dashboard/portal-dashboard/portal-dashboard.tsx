"use client";

import { type ReactNode, useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { faCirclePlus, faClock } from "@fortawesome/free-solid-svg-icons";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalFilesOverviewDto } from "@invessiv/common/contracts/portal/portal-files-overview.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { ChatDock, WidgetGrid } from "@invessiv/ui";
import type { PortalDashboardNavigationMode as PortalDashboardNavigationModeType } from "@/common/constants/portal/portal-dashboard-navigation-modes";
import { PortalDashboardNavigationMode } from "@/common/constants/portal/portal-dashboard-navigation-modes";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalWidgetDefinition } from "@/common/contracts/portal/portal-widget-definition";
import {
  buildPortalDashboardHref,
  readPortalDashboardProject,
  readPortalDashboardWidget,
} from "@/common/patterns/portal/portal-dashboard-query";
import { pickPortalOnboardingWidgetForm } from "@/common/patterns/portal/pick-portal-onboarding-widget-form";
import { buildPortalFeedbackPath } from "@/common/patterns/portal/portal-feedback-path";
import { describeUnreadBadge } from "@/common/patterns/crm/describe-unread-badge";
import type { Locale } from "@/config/i18n";
import { PortalConversation } from "@/components/portal/messages/portal-conversation/portal-conversation";
import { usePortalTaskCompletion } from "@/hooks/portal/use-portal-task-completion";
import type {
  PortalDashboardDictionary,
  PortalFilesDictionary,
  PortalMessagesDictionary,
} from "@/i18n/dictionaries/portal";
import { PortalDashboardEmptyState } from "../portal-dashboard-empty-state/portal-dashboard-empty-state";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import { PortalWidgetDialogHost } from "../portal-widget-dialog-host/portal-widget-dialog-host";
import { PortalCompletedProjectsWidget } from "../widgets/portal-completed-projects-widget/portal-completed-projects-widget";
import { PortalContactWidget } from "../widgets/portal-contact-widget/portal-contact-widget";
import { PortalCustomerTasksDialogContent } from "../widgets/portal-customer-tasks-widget/portal-customer-tasks-dialog-content";
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
  /** Files page of this customer, for the files widget. */
  filesHref: string;
  /** Null without `portal.files.read`; the files widget is then not rendered. */
  filesOverview: PortalFilesOverviewDto | null;
  /** Upload labels and file errors for attachments in the chat dock. */
  filesContent: PortalFilesDictionary;
  locale: Locale;
  messagesContent: PortalMessagesDictionary;
  /** The released forms of the company, newest first; empty without `portal.onboarding.read`. */
  onboarding: readonly PortalOnboardingFormSummaryDto[];
  /** Business day (`YYYY-MM-DD`) decided once on the server. */
  today: string;
  /** Already filtered on the server by permission and content. */
  widgets: readonly PortalWidgetDefinition[];
  /** Scopes locally kept drafts to the signed-in user. */
  viewerUserId: string;
};

/**
 * Orchestrates the widget grid, the dialog named in `?widget`, the project tab in `?project` and
 * the chat dock. Mount it with `key={customerId}` so no client state crosses companies.
 */
export function PortalDashboard({
  cockpitHref,
  content,
  conversation,
  customerId,
  dashboard,
  filesHref,
  filesOverview,
  filesContent,
  locale,
  messagesContent,
  onboarding,
  today,
  widgets,
  viewerUserId,
}: PortalDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dockExpanded, setDockExpanded] = useState(false);
  const dockId = useId();
  const ownerNoticeId = useId();
  const dialogOwnerNoticeId = useId();
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
  const selectedProject = readPortalDashboardProject(
    searchParams,
    dashboard.projects,
  );
  const { canCompleteTasks, isOwnerView } = dashboard.capabilities;

  function navigate(
    change: Parameters<typeof buildPortalDashboardHref>[2],
    mode: PortalDashboardNavigationModeType,
  ) {
    const href = buildPortalDashboardHref(
      pathname,
      searchParams.toString(),
      change,
    );
    router[mode](href, { scroll: false });
  }

  const openDialog = (widget: PortalWidgetKey) =>
    navigate({ widget }, PortalDashboardNavigationMode.Push);

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
    onCompleteAction: completion.complete,
    today,
  };
  const ourTasks = selectedProject
    ? dashboard.ourTasks.filter((task) => task.projectId === selectedProject.id)
    : dashboard.ourTasks;

  const onboardingForm = pickPortalOnboardingWidgetForm(onboarding);
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
    [PortalWidgetKey.Onboarding]: onboardingForm ? (
      <PortalOnboardingWidget
        content={content.widgets.onboarding}
        customerId={customerId}
        form={onboardingForm}
        locale={locale}
      />
    ) : null,
    [PortalWidgetKey.Project]: selectedProject ? (
      <PortalProjectWidget
        content={content.widgets.project}
        feedbackHref={
          dashboard.feedback?.some(
            (entry) =>
              entry.projectId === selectedProject.id && entry.status !== null,
          )
            ? buildPortalFeedbackPath({
                locale,
                customerId,
                projectId: selectedProject.id,
              })
            : null
        }
        feedbackLinkLabel={content.widgets.feedback.projectLink}
        locale={locale}
        onSelectProjectAction={(project) =>
          navigate({ project }, PortalDashboardNavigationMode.Replace)
        }
        projects={dashboard.projects}
        selectedProject={selectedProject}
      />
    ) : (
      <PortalDashboardEmptyState content={content.widgets.project} />
    ),
    [PortalWidgetKey.CustomerTasks]: (
      <PortalCustomerTasksWidget
        {...taskListProps}
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
        showProject={!selectedProject}
        tasks={ourTasks}
        today={today}
      />
    ),
    [PortalWidgetKey.Feedback]: dashboard.feedback ? (
      <PortalFeedbackWidget
        content={content.widgets.feedback}
        customerId={customerId}
        entries={dashboard.feedback}
        locale={locale}
      />
    ) : null,
    [PortalWidgetKey.Hours]: mockDialog(PortalWidgetKey.Hours, faClock),
    [PortalWidgetKey.Contact]: dashboard.contact ? (
      <PortalContactWidget
        contact={dashboard.contact}
        content={content.widgets.contact}
      />
    ) : null,
    [PortalWidgetKey.Files]: filesOverview ? (
      <PortalFilesWidget
        content={content.widgets.files}
        filesHref={filesHref}
        locale={locale}
        overview={filesOverview}
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
        customerTasksContent={
          <PortalCustomerTasksDialogContent
            {...taskListProps}
            doneTasks={doneCustomerTasks}
            openTasks={openCustomerTasks}
            ownerHintId={dialogOwnerNoticeId}
            ownerNotice={ownerNotice(dialogOwnerNoticeId)}
          />
        }
        onCloseAction={() =>
          navigate({ widget: null }, PortalDashboardNavigationMode.Replace)
        }
        widgetKey={openWidget}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {completion.announcement}
      </p>
    </div>
  );
}
