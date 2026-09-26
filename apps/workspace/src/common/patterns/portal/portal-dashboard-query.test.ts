import { describe, expect, it } from "vitest";

import { PortalWidgetKey } from "@/common/constants/portal/portal-widget-keys";
import {
  buildPortalDashboardHref,
  readPortalDashboardProject,
  readPortalDashboardWidget,
} from "./portal-dashboard-query";

const projects = [{ id: "first" }, { id: "second" }];

describe("readPortalDashboardWidget", () => {
  it("opens registered dialog widgets only", () => {
    expect(
      readPortalDashboardWidget(new URLSearchParams("widget=customerTasks")),
    ).toBe(PortalWidgetKey.CustomerTasks);
    expect(
      readPortalDashboardWidget(new URLSearchParams("widget=ourTasks")),
    ).toBeNull();
    expect(
      readPortalDashboardWidget(new URLSearchParams("widget=unknown")),
    ).toBeNull();
    expect(readPortalDashboardWidget(new URLSearchParams())).toBeNull();
  });
});

describe("readPortalDashboardProject", () => {
  it("selects the requested project", () => {
    expect(
      readPortalDashboardProject(
        new URLSearchParams("project=second"),
        projects,
      ),
    ).toEqual({ id: "second" });
  });

  it("falls back to the first project for an unknown id", () => {
    expect(
      readPortalDashboardProject(
        new URLSearchParams("project=foreign"),
        projects,
      ),
    ).toEqual({ id: "first" });
    expect(readPortalDashboardProject(new URLSearchParams(), [])).toBeNull();
  });
});

describe("buildPortalDashboardHref", () => {
  it("sets, keeps and removes parameters", () => {
    expect(
      buildPortalDashboardHref("/de/portal/c", "project=a", {
        widget: PortalWidgetKey.Files,
      }),
    ).toBe("/de/portal/c?project=a&widget=files");
    expect(
      buildPortalDashboardHref("/de/portal/c", "project=a&widget=files", {
        widget: null,
      }),
    ).toBe("/de/portal/c?project=a");
    expect(
      buildPortalDashboardHref("/de/portal/c", "widget=files", {
        widget: null,
        project: "b",
      }),
    ).toBe("/de/portal/c?project=b");
    expect(buildPortalDashboardHref("/de/portal/c", "", { widget: null })).toBe(
      "/de/portal/c",
    );
  });
});
