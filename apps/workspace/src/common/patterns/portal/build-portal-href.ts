import {
  PORTAL_DASHBOARD_CHAT_OPEN,
  PortalDashboardQueryParam,
} from "@/common/constants/portal/portal-dashboard-query-params";
import type { PortalQueryChange } from "@/common/contracts/portal/portal-query-change";

/** Preserve unrelated URL state while changing the portal project, dashboard dialog or chat dock. */
export function buildPortalHref(
  basePath: string,
  queryString: string,
  change: PortalQueryChange,
): string {
  const params = new URLSearchParams(queryString);
  for (const [name, value] of [
    [PortalDashboardQueryParam.Widget, change.widget],
    [PortalDashboardQueryParam.Project, change.project],
    [
      PortalDashboardQueryParam.Chat,
      change.chat === true ? PORTAL_DASHBOARD_CHAT_OPEN : change.chat,
    ],
    [PortalDashboardQueryParam.HoursProject, change.hoursProject],
    [PortalDashboardQueryParam.Service, change.service],
  ] as const) {
    if (value === null) params.delete(name);
    else if (value !== undefined) params.set(name, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
