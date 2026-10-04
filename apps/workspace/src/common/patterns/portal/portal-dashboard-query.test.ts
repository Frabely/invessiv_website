import { describe, expect, it } from "vitest";

import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import { buildPortalHref } from "./build-portal-href";
import { readPortalDashboardWidget } from "./portal-dashboard-query";

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

describe("buildPortalHref", () => {
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
  });
});
