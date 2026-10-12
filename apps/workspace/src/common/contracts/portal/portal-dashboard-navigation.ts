import type { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
export type PortalDashboardNavigation = {
  openWidget: PortalWidgetKey | null;
  dockExpanded: boolean;
  credentialsCreate: boolean;
  initialService: string | null;
  openDialog: (widget: PortalWidgetKey) => void;
  closeDialog: () => void;
  openCredentials: (create: boolean) => void;
  setDockExpanded: (expanded: boolean) => void;
  selectService: (service: string | null) => void;
  refreshServices: () => void;
  finishTaskRequest: () => void;
};
