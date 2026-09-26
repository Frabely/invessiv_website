import { describe, expect, it } from "vitest";
import { DashboardModuleKey } from "./dashboard-module-keys";

describe("DashboardModuleKey", () => {
  it("keeps the dashboard slot identifiers unique", () => {
    expect(DashboardModuleKey).toEqual({
      DueTasks: "dueTasks",
      AcquisitionVolume: "acquisitionVolume",
      Messaging: "messaging",
      SourcePerformance: "sourcePerformance",
      TimeToContact: "timeToContact",
      OutreachActivity: "outreachActivity",
      HotLeads: "hotLeads",
      FunnelVelocity: "funnelVelocity",
      ActivityHeatmap: "activityHeatmap",
    });
    expect(new Set(Object.values(DashboardModuleKey)).size).toBe(9);
  });
});
