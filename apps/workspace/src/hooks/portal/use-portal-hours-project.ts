"use client";

import {
  PORTAL_HOURS_ALL_PROJECTS,
  PortalDashboardQueryParam,
} from "@/common/constants/portal/portal-dashboard-query-params";
import { portalHoursView } from "@/common/patterns/portal/portal-hours-view";
import { useUrlSearch } from "@/hooks/shared/use-url-search";

/**
 * The project the hours dialog shows, kept in `?hoursProject` so a reload stays on it. Without the
 * parameter the dialog follows the dashboard's project; choosing every project writes `all`.
 */
export function usePortalHoursProject(
  projectIds: readonly string[],
  dashboardProjectId: string | null,
) {
  const { search, replace } = useUrlSearch();
  const projectId = portalHoursView.projectOf(
    new URLSearchParams(search).get(PortalDashboardQueryParam.HoursProject),
    projectIds,
    dashboardProjectId,
  );

  /** Writes the choice to the URL without a server round trip. */
  function selectProject(next: string | null) {
    replace((params) =>
      params.set(
        PortalDashboardQueryParam.HoursProject,
        next ?? PORTAL_HOURS_ALL_PROJECTS,
      ),
    );
  }

  return { projectId, selectProject };
}
