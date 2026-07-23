import { describe, expect, it } from "vitest";
import { DateRangePreset } from "@/common/constants/date-range/date-range-presets";
import { getDateRangeForPreset } from "./date-range-preset-range";

describe("getDateRangeForPreset", () => {
  it("uses UTC calendar dates consistently around a local-day boundary", () => {
    expect(
      getDateRangeForPreset(
        DateRangePreset.Last7Days,
        new Date("2026-07-19T22:30:00.000Z"),
      ),
    ).toEqual({
      preset: DateRangePreset.Last7Days,
      from: "2026-07-13",
      to: "2026-07-19",
    });
  });

  it("returns no bounds for All and Custom", () => {
    expect(getDateRangeForPreset(DateRangePreset.All)).toEqual({
      preset: DateRangePreset.All,
      from: undefined,
      to: undefined,
    });
    expect(getDateRangeForPreset(DateRangePreset.Custom)).toEqual({
      preset: DateRangePreset.Custom,
      from: undefined,
      to: undefined,
    });
  });
});
