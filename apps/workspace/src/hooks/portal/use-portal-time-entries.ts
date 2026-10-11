"use client";

import { useSearchParams } from "next/navigation";
import type { PortalTimeEntryDto } from "@invessiv/common/contracts/portal/portal-time-entry.dto";
import { portalHoursApiService } from "@/client/portal/portal-hours-api-service";
import { PortalDashboardQueryParam } from "@/common/constants/portal/portal-dashboard-query-params";
import { useCursorPagedList } from "@/hooks/shared/use-cursor-paged-list";

/**
 * The time entry list of the hours dialog: loaded when the dialog opens, never with the dashboard,
 * and page by page afterwards. The project filter lives in the URL (`?hoursProject=<id>`) so a
 * reload keeps it; an id that is not one of `projectIds` counts as no filter.
 */
export function usePortalTimeEntries(
  customerId: string,
  projectIds: readonly string[],
) {
  const requested = useSearchParams().get(
    PortalDashboardQueryParam.HoursProject,
  );
  const projectId =
    requested && projectIds.includes(requested) ? requested : null;
  const list = useCursorPagedList<PortalTimeEntryDto>(
    JSON.stringify([customerId, projectId]),
    async (cursor) => {
      const result = await portalHoursApiService.listTimeEntries(customerId, {
        projectId: projectId ?? undefined,
        ...(cursor ? { cursor } : {}),
      });
      return result.ok ? result.value : null;
    },
  );

  /** Writes the filter to the URL without a server round trip; the list reloads from page one. */
  function selectProject(next: string | null) {
    const url = new URL(window.location.href);
    if (next)
      url.searchParams.set(PortalDashboardQueryParam.HoursProject, next);
    else url.searchParams.delete(PortalDashboardQueryParam.HoursProject);
    window.history.replaceState(window.history.state, "", url);
  }

  return { ...list, projectId, selectProject };
}
