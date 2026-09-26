import type { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { WidgetLayoutEntry } from "@invessiv/common/contracts/ui/widget-layout";
import type { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalWidgetScope } from "@/common/constants/portal/portal-widget-scopes";

/**
 * A mock carries no permission because it shows no data; the folder that makes it real sets
 * `mock: false` and must then name the permission that guards its data.
 */
type PortalWidgetDataSource =
  { mock: true } | { mock: false; requiredPermission: Permission };

export type PortalWidgetDefinition = WidgetLayoutEntry<PortalWidgetKey> &
  PortalWidgetDataSource & {
    /** How the widget opens its detail: dialog, in-place expansion, the chat dock or not at all. */
    openMode: WidgetOpenMode;
    /** Company-wide data or data of the selected project. */
    scope: PortalWidgetScope;
    /** Hidden entirely while its data part is empty instead of showing an empty state. */
    onlyWithContent: boolean;
  };
