import {
  PORTAL_DASHBOARD_CHAT_OPEN,
  PortalDashboardQueryParam,
} from "@/common/constants/portal/portal-dashboard-query-params";
import type { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";

type PortalQueryChange = {
  widget?: PortalWidgetKey | null;
  project?: string | null;
  /** `true` opens the dashboard's chat dock on arrival; `null` drops the request again. */
  chat?: true | null;
};

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
  ] as const) {
    if (value === null) params.delete(name);
    else if (value !== undefined) params.set(name, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
