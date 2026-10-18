import type { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
export type PortalDashboardNavigation = {
  openWidget: PortalWidgetKey | null;
  dockExpanded: boolean;
  credentialsCreate: boolean;
  /** The changed request list is still being loaded; keep the dialog's navigation locked. */
  servicesRefreshing: boolean;
  initialService: string | null;
  openDialog: (widget: PortalWidgetKey) => void;
  closeDialog: () => void;
  openCredentials: (create: boolean) => void;
  setDockExpanded: (expanded: boolean) => void;
  selectService: (service: string | null) => void;
  refreshServices: () => void;
  finishTaskRequest: () => void;
};
