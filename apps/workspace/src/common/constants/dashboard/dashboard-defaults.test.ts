import { describe, expect, it } from "vitest";
import { DateRangePreset } from "@/common/constants/date-range/date-range-presets";
import { DEFAULT_DASHBOARD_RANGE_PRESET } from "./dashboard-defaults";

describe("dashboard defaults", () => {
  it("uses the last seven calendar days", () => {
    expect(DEFAULT_DASHBOARD_RANGE_PRESET).toBe(DateRangePreset.Last7Days);
  });
});
