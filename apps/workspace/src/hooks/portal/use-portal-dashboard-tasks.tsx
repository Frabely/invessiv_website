"use client";
import { useId } from "react";
import type { PortalDashboardDto } from "@invessiv/common/contracts/portal/portal-dashboard.dto";
import type { PortalDashboardTaskActions } from "@/common/contracts/portal/portal-dashboard-task-actions";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import type { Locale } from "@/config/i18n";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";

export function usePortalDashboardTasks(
  dashboard: PortalDashboardDto,
  content: PortalDashboardDictionary,
  actions: PortalDashboardTaskActions,
  locale: Locale,
  today: string,
  cockpitHref: string | null,
) {
  const ownerNoticeId = useId();
  const { canCompleteTasks, canCreateTasks, isOwnerView } =
    dashboard.capabilities;
  return {
    requestProjectId: canCreateTasks ? dashboard.selectedProjectId : null,
    ownerNoticeId,
    ownerNotice:
      isOwnerView && cockpitHref ? (
        <PortalOwnerNotice
          cockpitHref={cockpitHref}
          hint={content.widgets.customerTasks.ownerHint}
          id={ownerNoticeId}
          linkLabel={content.widgets.customerTasks.ownerLink}
        />
      ) : null,
    openTasks: dashboard.customerTasks.filter((task) => !task.done),
    doneTasks: dashboard.customerTasks.filter((task) => task.done),
    listProps: {
      ...actions,
      canComplete: canCompleteTasks,
      content,
      isOwnerView,
      locale,
      today,
    },
  };
}
