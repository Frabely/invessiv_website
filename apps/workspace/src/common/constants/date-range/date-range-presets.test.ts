import { describe, expect, it } from "vitest";
import { DateRangePreset, DateRangePresetDays } from "./date-range-presets";

describe("DateRangePreset", () => {
  it("contains every preset exactly once", () => {
    expect(DateRangePreset).toEqual({
      Today: "today",
      Last7Days: "last-7-days",
      Last30Days: "last-30-days",
      Last90Days: "last-90-days",
      All: "all",
      Custom: "custom",
    });
    const values = Object.values(DateRangePreset);
    expect(new Set(values).size).toBe(values.length);
  });

  it("defines the inclusive calendar-day count for bounded presets", () => {
    expect(DateRangePresetDays).toEqual({
      today: 1,
      "last-7-days": 7,
      "last-30-days": 30,
      "last-90-days": 90,
    });
  });
});
