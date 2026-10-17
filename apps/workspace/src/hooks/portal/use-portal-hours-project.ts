"use client";

import { useSearchParams } from "next/navigation";
import {
  PORTAL_HOURS_ALL_PROJECTS,
  PortalDashboardQueryParam,
} from "@/common/constants/portal/portal-dashboard-query-params";
import { portalHoursView } from "@/common/patterns/portal/portal-hours-view";

/**
 * The project the hours dialog shows, kept in `?hoursProject` so a reload stays on it. Without the
 * parameter the dialog follows the dashboard's project; choosing every project writes `all`.
 */
export function usePortalHoursProject(
  projectIds: readonly string[],
  dashboardProjectId: string | null,
) {
  const projectId = portalHoursView.projectOf(
    useSearchParams().get(PortalDashboardQueryParam.HoursProject),
    projectIds,
    dashboardProjectId,
  );

  /**
   * Writes the choice to the URL without a server round trip. The state must be null: Next.js
   * ignores a history write that carries its own internal state and would not update the params.
   */
  function selectProject(next: string | null) {
    const url = new URL(window.location.href);
    url.searchParams.set(
      PortalDashboardQueryParam.HoursProject,
      next ?? PORTAL_HOURS_ALL_PROJECTS,
    );
    window.history.replaceState(null, "", url);
  }

  return { projectId, selectProject };
}
