import { describe, expect, it } from "vitest";
import { DashboardRangeKind } from "./dashboard-range-kinds";

describe("DashboardRangeKind", () => {
  it("defines distinct bounded and all states", () => {
    expect(DashboardRangeKind).toEqual({ Bounded: "bounded", All: "all" });
    expect(new Set(Object.values(DashboardRangeKind)).size).toBe(2);
  });
});
