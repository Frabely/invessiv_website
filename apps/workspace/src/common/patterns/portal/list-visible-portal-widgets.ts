import type { Permission } from "@invessiv/common/constants/auth/permissions";
import { PORTAL_WIDGET_LAYOUT } from "@/common/constants/portal/portal-widget-layout";
import type { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalWidgetDefinition } from "@/common/contracts/portal/portal-widget-definition";

/**
 * A real widget needs its permission; a widget marked `onlyWithContent` additionally needs data.
 * Mocks show no data and therefore need neither.
 */
export function listVisiblePortalWidgets(
  permissions: ReadonlySet<Permission>,
  keysWithContent: ReadonlySet<PortalWidgetKey>,
  layout: readonly PortalWidgetDefinition[] = PORTAL_WIDGET_LAYOUT,
): readonly PortalWidgetDefinition[] {
  return layout.filter(
    (entry) =>
      (entry.mock || permissions.has(entry.requiredPermission)) &&
      (!entry.onlyWithContent || keysWithContent.has(entry.key)),
  );
}
