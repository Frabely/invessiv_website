import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WidgetColumnSpan } from "@invessiv/common/constants/ui/widget-column-spans";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { WidgetResponsiveSpan } from "@invessiv/common/contracts/ui/widget-layout";
import type { PortalWidgetDefinition } from "@/common/contracts/portal/portal-widget-definition";
import { PortalWidgetKey } from "./portal-widget-keys";
import { PortalWidgetScope } from "./portal-widget-scopes";

const COMPACT_ROW: WidgetResponsiveSpan = {
  mobile: WidgetColumnSpan.Full,
  tablet: WidgetColumnSpan.Six,
  desktop: WidgetColumnSpan.Four,
};

const QUARTER_ROW: WidgetResponsiveSpan = {
  mobile: WidgetColumnSpan.Full,
  tablet: WidgetColumnSpan.Six,
  desktop: WidgetColumnSpan.Three,
};

/**
 * The only place a portal card is registered. Orders step by ten so a later folder can slot in
 * without renumbering; stable keys and spans keep a later drag-and-drop layout possible.
 */
export const PORTAL_WIDGET_LAYOUT: readonly PortalWidgetDefinition[] = [
  {
    key: PortalWidgetKey.Onboarding,
    order: 10,
    span: COMPACT_ROW,
    openMode: WidgetOpenMode.Dialog,
    scope: PortalWidgetScope.Customer,
    mock: true,
    onlyWithContent: false,
  },
  {
    key: PortalWidgetKey.Project,
    order: 20,
    span: COMPACT_ROW,
    openMode: WidgetOpenMode.None,
    scope: PortalWidgetScope.Project,
    mock: false,
    requiredPermission: Permission.PortalProjectsRead,
    onlyWithContent: false,
  },
  {
    key: PortalWidgetKey.ServiceRequest,
    order: 30,
    span: COMPACT_ROW,
    openMode: WidgetOpenMode.Dialog,
    scope: PortalWidgetScope.Customer,
    mock: true,
    onlyWithContent: false,
  },
  {
    key: PortalWidgetKey.CustomerTasks,
    order: 40,
    span: COMPACT_ROW,
    openMode: WidgetOpenMode.Dialog,
    scope: PortalWidgetScope.Customer,
    mock: false,
    requiredPermission: Permission.PortalTasksRead,
    onlyWithContent: false,
  },
  {
    key: PortalWidgetKey.OurTasks,
    order: 50,
    span: COMPACT_ROW,
    openMode: WidgetOpenMode.Expand,
    scope: PortalWidgetScope.Project,
    mock: false,
    requiredPermission: Permission.PortalTasksRead,
    onlyWithContent: false,
  },
  {
    key: PortalWidgetKey.Feedback,
    order: 60,
    span: COMPACT_ROW,
    openMode: WidgetOpenMode.Dialog,
    scope: PortalWidgetScope.Project,
    mock: true,
    onlyWithContent: false,
  },
  {
    key: PortalWidgetKey.Contact,
    order: 80,
    span: QUARTER_ROW,
    openMode: WidgetOpenMode.None,
    scope: PortalWidgetScope.Customer,
    mock: false,
    requiredPermission: Permission.PortalAccess,
    onlyWithContent: true,
  },
  {
    key: PortalWidgetKey.Files,
    order: 90,
    span: QUARTER_ROW,
    openMode: WidgetOpenMode.Dialog,
    scope: PortalWidgetScope.Customer,
    mock: true,
    onlyWithContent: false,
  },
  {
    key: PortalWidgetKey.Hours,
    order: 100,
    span: QUARTER_ROW,
    openMode: WidgetOpenMode.Dialog,
    scope: PortalWidgetScope.Customer,
    mock: true,
    onlyWithContent: false,
  },
  {
    key: PortalWidgetKey.CompletedProjects,
    order: 110,
    span: QUARTER_ROW,
    openMode: WidgetOpenMode.Expand,
    scope: PortalWidgetScope.Customer,
    mock: false,
    requiredPermission: Permission.PortalProjectsRead,
    onlyWithContent: true,
  },
];
