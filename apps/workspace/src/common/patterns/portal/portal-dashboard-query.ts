import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import { PortalDashboardQueryParam } from "@/common/constants/portal/portal-dashboard-query-params";
import { PORTAL_WIDGET_LAYOUT } from "@/common/constants/portal/portal-widget-layout";
import type { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";

type SearchParamsReader = { get(name: string): string | null };

/** Only a widget registered with a dialog opens from the URL; anything else is ignored. */
export function readPortalDashboardWidget(
  searchParams: SearchParamsReader,
): PortalWidgetKey | null {
  const value = searchParams.get(PortalDashboardQueryParam.Widget);
  const entry = PORTAL_WIDGET_LAYOUT.find(
    (candidate) =>
      candidate.key === value &&
      (candidate.openMode === WidgetOpenMode.Dialog ||
        candidate.actionDialog === true),
  );
  return entry?.key ?? null;
}
