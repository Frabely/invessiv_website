import { PortalDashboardQueryParam } from "@/common/constants/portal/portal-dashboard-query-params";
import type { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";

type PortalQueryChange = {
  widget?: PortalWidgetKey | null;
  project?: string | null;
  /** Only ever cleared here; the hours dialog sets its own filter without a navigation. */
  hoursProject?: null;
};

/** Preserve unrelated URL state while changing the portal project or dashboard dialog. */
export function buildPortalHref(
  basePath: string,
  queryString: string,
  change: PortalQueryChange,
): string {
  const params = new URLSearchParams(queryString);
  for (const [name, value] of [
    [PortalDashboardQueryParam.Widget, change.widget],
    [PortalDashboardQueryParam.Project, change.project],
    [PortalDashboardQueryParam.HoursProject, change.hoursProject],
  ] as const) {
    if (value === null) params.delete(name);
    else if (value !== undefined) params.set(name, value);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
