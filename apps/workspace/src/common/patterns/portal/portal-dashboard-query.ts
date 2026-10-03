import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import { PortalDashboardQueryParam } from "@/common/constants/portal/portal-dashboard-query-params";
import { PORTAL_WIDGET_LAYOUT } from "@/common/constants/portal/portal-widget-layout";
import type { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";

type SearchParamsReader = { get(name: string): string | null };

/** Only a registered dialog widget opens from the URL; anything else is ignored. */
export function readPortalDashboardWidget(
  searchParams: SearchParamsReader,
): PortalWidgetKey | null {
  const value = searchParams.get(PortalDashboardQueryParam.Widget);
  const entry = PORTAL_WIDGET_LAYOUT.find(
    (candidate) =>
      candidate.key === value && candidate.openMode === WidgetOpenMode.Dialog,
  );
  return entry?.key ?? null;
}

/**
 * The selected project of the dashboard. An unknown or foreign id falls back to the first project
 * without an error, so a guessed id confirms nothing.
 */
export function readPortalDashboardProject<Project extends { id: string }>(
  searchParams: SearchParamsReader,
  projects: readonly Project[],
): Project | null {
  const value = searchParams.get(PortalDashboardQueryParam.Project);
  return (
    projects.find((project) => project.id === value) ?? projects[0] ?? null
  );
}
