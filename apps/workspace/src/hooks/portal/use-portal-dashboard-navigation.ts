"use client";
import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PortalDashboardNavigationMode } from "@/common/constants/portal/portal-dashboard-navigation-modes";
import type { PortalDashboardNavigationMode as NavigationMode } from "@/common/constants/portal/portal-dashboard-navigation-modes";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import type { PortalWidgetDefinition } from "@/common/contracts/portal/portal-widget-definition";
import type { PortalDashboardNavigation } from "@/common/contracts/portal/portal-dashboard-navigation";
import type { PortalQueryChange } from "@/common/contracts/portal/portal-query-change";
import { buildPortalHref } from "@/common/patterns/portal/build-portal-href";
import {
  readPortalDashboardChat,
  readPortalDashboardService,
  readPortalDashboardWidget,
} from "@/common/patterns/portal/portal-dashboard-query";

/** Owns URL transitions; choosing a service or toggling the chat deliberately avoids a server navigation. */
export function usePortalDashboardNavigation(
  widgets: readonly PortalWidgetDefinition[],
): PortalDashboardNavigation {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dockOpen, setDockOpen] = useState(false);
  const [credentialsCreate, setCredentialsCreate] = useState(false);
  const [servicesRefreshing, startServicesRefresh] = useTransition();
  const requestedWidget = readPortalDashboardWidget(searchParams);
  const visibleKeys = new Set(widgets.map((entry) => entry.key));
  const openWidget =
    requestedWidget && visibleKeys.has(requestedWidget)
      ? requestedWidget
      : null;
  const chatRequested = readPortalDashboardChat(searchParams);
  const dockExpanded = dockOpen || chatRequested;
  function navigate(change: PortalQueryChange, mode: NavigationMode) {
    const href = buildPortalHref(pathname, searchParams.toString(), change);
    router[mode](href, { scroll: false });
  }

  function setDockExpanded(expanded: boolean) {
    setDockOpen(expanded);
    if (!chatRequested) return;
    // The link's request is spent on the first toggle; dropping it needs no server roundtrip.
    window.history.replaceState(
      null,
      "",
      buildPortalHref(pathname, searchParams.toString(), { chat: null }),
    );
  }

  const openDialog = (widget: PortalWidgetKey) =>
    navigate({ widget }, PortalDashboardNavigationMode.Push);
  const closeDialog = () =>
    navigate(
      { widget: null, hoursProject: null, service: null },
      PortalDashboardNavigationMode.Replace,
    );
  const openCredentials = (create: boolean) => {
    setCredentialsCreate(create);
    openDialog(PortalWidgetKey.Credentials);
  };

  function selectService(service: string | null) {
    window.history.replaceState(
      null,
      "",
      buildPortalHref(pathname, window.location.search, { service }),
    );
  }
  function refreshServices() {
    // Wait for both router actions before allowing the next history-only selection. Otherwise
    // an unfinished refresh can reload the next form and abort its submission.
    startServicesRefresh(() => {
      navigate({ service: null }, PortalDashboardNavigationMode.Replace);
      router.refresh();
    });
  }
  function finishTaskRequest() {
    closeDialog();
    router.refresh();
  }
  return {
    openWidget,
    dockExpanded,
    credentialsCreate,
    servicesRefreshing,
    initialService: readPortalDashboardService(searchParams),
    openDialog,
    closeDialog,
    openCredentials,
    setDockExpanded,
    selectService,
    refreshServices,
    finishTaskRequest,
  };
}
