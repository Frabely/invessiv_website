import { PORTAL_HOURS_ALL_PROJECTS } from "@/common/constants/portal/portal-dashboard-query-params";
import {
  PORTAL_HOURS_TAB_VALUES,
  PortalHoursTab,
} from "@/common/constants/portal/portal-hours-tabs";

/**
 * The project the hours dialog shows; null is the company-wide view. `?hoursProject` wins (a known
 * id or `all`), then the project of the dashboard if it is visible, otherwise every project.
 */
function projectOf(
  requested: string | null,
  projectIds: readonly string[],
  dashboardProjectId: string | null,
): string | null {
  if (requested === PORTAL_HOURS_ALL_PROJECTS) return null;
  if (requested && projectIds.includes(requested)) return requested;
  if (dashboardProjectId && projectIds.includes(dashboardProjectId))
    return dashboardProjectId;
  return null;
}

/** The tabs of the overview: entries need their read right, purchases are always there. */
function tabsFor(canReadEntries: boolean): PortalHoursTab[] {
  return PORTAL_HOURS_TAB_VALUES.filter(
    (tab) => tab !== PortalHoursTab.Entries || canReadEntries,
  );
}

export const portalHoursView = { projectOf, tabsFor } as const;
