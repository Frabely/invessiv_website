"use client";

import { type ReactNode, useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  faCirclePlus,
  faClock,
  faHandHoldingHeart,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
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
import type { Locale } from "@/config/i18n";
import { usePortalTaskCompletion } from "@/hooks/portal/use-portal-task-completion";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PortalDashboardEmptyState } from "../portal-dashboard-empty-state/portal-dashboard-empty-state";
import { PortalOwnerTaskNotice } from "../portal-owner-task-notice/portal-owner-task-notice";
import { PortalWidgetDialogHost } from "../portal-widget-dialog-host/portal-widget-dialog-host";
import { PortalCompletedProjectsWidget } from "../widgets/portal-completed-projects-widget/portal-completed-projects-widget";
import { PortalContactWidget } from "../widgets/portal-contact-widget/portal-contact-widget";
import { PortalCustomerTasksDialogContent } from "../widgets/portal-customer-tasks-widget/portal-customer-tasks-dialog-content";
import { PortalCustomerTasksWidget } from "../widgets/portal-customer-tasks-widget/portal-customer-tasks-widget";
import { PortalFilesWidget } from "../widgets/portal-files-widget/portal-files-widget";
import { PortalMockWidget } from "../widgets/portal-mock-widget/portal-mock-widget";
import { PortalOurTasksWidget } from "../widgets/portal-our-tasks-widget/portal-our-tasks-widget";
import { PortalProjectWidget } from "../widgets/portal-project-widget/portal-project-widget";
import styles from "./portal-dashboard.module.css";

export type PortalDashboardProps = {
  /** Cockpit link for the owner view's disabled actions; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalDashboardDictionary;
  customerId: string;
  dashboard: PortalDashboardDto;
  locale: Locale;
  /** Business day (`YYYY-MM-DD`) decided once on the server. */
  today: string;
  /** Already filtered on the server by permission and content. */
  widgets: readonly PortalWidgetDefinition[];
};

/**
 * Orchestrates the widget grid, the dialog named in `?widget`, the project tab in `?project` and
 * the chat dock. Mount it with `key={customerId}` so no client state crosses companies.
 */
export function PortalDashboard({
  cockpitHref,
  content,
  customerId,
  dashboard,
  locale,
  today,
  widgets,
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
      <PortalOwnerTaskNotice
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

  const mockBadge = content.mock.badge;
  const mockDialog = (
    key:
      | typeof PortalWidgetKey.Onboarding
      | typeof PortalWidgetKey.Feedback
      | typeof PortalWidgetKey.Hours
      | typeof PortalWidgetKey.ServiceRequest,
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
    [PortalWidgetKey.Onboarding]: mockDialog(
      PortalWidgetKey.Onboarding,
      faRocket,
    ),
    [PortalWidgetKey.Project]: selectedProject ? (
      <PortalProjectWidget
        content={content.widgets.project}
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
    [PortalWidgetKey.Feedback]: mockDialog(
      PortalWidgetKey.Feedback,
      faHandHoldingHeart,
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
        badgeLabel={mockBadge}
        content={content.widgets.files}
        onOpenAction={() => openDialog(PortalWidgetKey.Files)}
      />
    ),
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
      <div
        className={styles.dock}
        data-owner-view={cockpitHref ? "true" : undefined}
        id={dockId}
      >
        <ChatDock
          badgeLabel={mockBadge}
          className={styles.chat}
          content={content.chat}
          expanded={dockExpanded}
          onExpandedChangeAction={setDockExpanded}
          overlay
        />
      </div>
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
