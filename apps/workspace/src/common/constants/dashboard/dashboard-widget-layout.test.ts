import { describe, expect, it } from "vitest";
import { DASHBOARD_WIDGET_LAYOUT } from "./dashboard-widget-layout";

describe("DASHBOARD_WIDGET_LAYOUT", () => {
  it("keeps unique keys in their existing order and twelve-column spans", () => {
    expect(DASHBOARD_WIDGET_LAYOUT.map((entry) => entry.key)).toEqual([
      "dueTasks",
      "messaging",
      "acquisitionVolume",
      "hotLeads",
      "timeToContact",
      "sourcePerformance",
      "outreachActivity",
      "funnelVelocity",
      "activityHeatmap",
    ]);
    expect(
      new Set(DASHBOARD_WIDGET_LAYOUT.map((entry) => entry.key)).size,
    ).toBe(DASHBOARD_WIDGET_LAYOUT.length);
    expect(
      DASHBOARD_WIDGET_LAYOUT.every(
        (entry) =>
          [4, 6, 8, 12].includes(entry.span.mobile) &&
          [4, 6, 8, 12].includes(entry.span.tablet) &&
          [4, 6, 8, 12].includes(entry.span.desktop),
      ),
    ).toBe(true);
  });
});
