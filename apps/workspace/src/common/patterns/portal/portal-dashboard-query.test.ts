import { describe, expect, it } from "vitest";
import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { buildPortalHref } from "./build-portal-href";
import {
  readPortalDashboardChat,
  readPortalDashboardService,
  readPortalDashboardWidget,
} from "./portal-dashboard-query";

describe("readPortalDashboardWidget", () => {
  it("opens registered dialog widgets only", () => {
    expect(
      readPortalDashboardWidget(new URLSearchParams("widget=customerTasks")),
    ).toBe(PortalWidgetKey.CustomerTasks);
    expect(
      readPortalDashboardWidget(new URLSearchParams("widget=ourTasks")),
    ).toBe(PortalWidgetKey.OurTasks);
    expect(
      readPortalDashboardWidget(new URLSearchParams("widget=feedback")),
    ).toBeNull();
    expect(
      readPortalDashboardWidget(new URLSearchParams("widget=unknown")),
    ).toBeNull();
    expect(readPortalDashboardWidget(new URLSearchParams())).toBeNull();
  });
});

describe("readPortalDashboardChat", () => {
  it("opens the dock for the exact value only", () => {
    expect(readPortalDashboardChat(new URLSearchParams("chat=open"))).toBe(
      true,
    );
    expect(readPortalDashboardChat(new URLSearchParams("chat=1"))).toBe(false);
    expect(readPortalDashboardChat(new URLSearchParams())).toBe(false);
  });
});

describe("readPortalDashboardService", () => {
  it("reads the named service and treats an empty value as none", () => {
    expect(
      readPortalDashboardService(new URLSearchParams("service=custom")),
    ).toBe("custom");
    expect(readPortalDashboardService(new URLSearchParams("service="))).toBe(
      null,
    );
    expect(readPortalDashboardService(new URLSearchParams())).toBeNull();
  });
});

describe("buildPortalHref", () => {
  it("opens the service request dialog on a service and drops it again", () => {
    expect(
      buildPortalHref("/de/portal/c", "", {
        widget: PortalWidgetKey.ServiceRequest,
        service: "s-1",
        project: "p-1",
      }),
    ).toBe("/de/portal/c?widget=serviceRequest&project=p-1&service=s-1");
    expect(
      buildPortalHref("/de/portal/c", "widget=serviceRequest&service=s-1", {
        widget: null,
        service: null,
      }),
    ).toBe("/de/portal/c");
  });

  it("clears the hours filter while preserving or opening the chat dock", () => {
    expect(
      buildPortalHref("/de/portal/c", "chat=open&hoursProject=p", {
        hoursProject: null,
      }),
    ).toBe("/de/portal/c?chat=open");
    expect(
      buildPortalHref("/de/portal/c", "hoursProject=p", { chat: true }),
    ).toBe("/de/portal/c?hoursProject=p&chat=open");
  });

  it("sets, keeps and removes parameters", () => {
    expect(
      buildPortalHref("/de/portal/c", "project=a", {
        widget: PortalWidgetKey.Files,
      }),
    ).toBe("/de/portal/c?project=a&widget=files");
    expect(
      buildPortalHref("/de/portal/c", "project=a&widget=files", {
        widget: null,
      }),
    ).toBe("/de/portal/c?project=a");
    expect(
      buildPortalHref("/de/portal/c", "widget=files", {
        widget: null,
        project: "b",
      }),
    ).toBe("/de/portal/c?project=b");
    expect(buildPortalHref("/de/portal/c", "", { widget: null })).toBe(
      "/de/portal/c",
    );
    expect(
      buildPortalHref("/de/portal/c", "", { project: "a", chat: true }),
    ).toBe("/de/portal/c?project=a&chat=open");
    expect(
      buildPortalHref("/de/portal/c", "project=a&chat=open", { chat: null }),
    ).toBe("/de/portal/c?project=a");
  });
});
