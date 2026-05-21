import { describe, expect, it } from "vitest";
import { calculateKpiDelta } from "./calculate-kpi-delta";

describe("calculateKpiDelta", () => {
  it("returns trend 'up' with positive percent when current exceeds previous", () => {
    expect(calculateKpiDelta(120, 100)).toEqual({
      deltaPercent: 20,
      trend: "up",
    });
  });

  it("returns trend 'down' with negative percent when current is below previous", () => {
    expect(calculateKpiDelta(80, 100)).toEqual({
      deltaPercent: -20,
      trend: "down",
    });
  });

  it("returns trend 'flat' with zero percent when current equals previous", () => {
    expect(calculateKpiDelta(100, 100)).toEqual({
      deltaPercent: 0,
      trend: "flat",
    });
  });

  it("returns null deltaPercent and trend 'up' when previous is 0 and current > 0", () => {
    expect(calculateKpiDelta(5, 0)).toEqual({
      deltaPercent: null,
      trend: "up",
    });
  });

  it("returns null deltaPercent and trend 'flat' when both are 0", () => {
    expect(calculateKpiDelta(0, 0)).toEqual({
      deltaPercent: null,
      trend: "flat",
    });
  });

  it("rounds deltaPercent to a single decimal", () => {
    expect(calculateKpiDelta(33, 30)).toEqual({
      deltaPercent: 10,
      trend: "up",
    });
    expect(calculateKpiDelta(31, 30)).toEqual({
      deltaPercent: 3.3,
      trend: "up",
    });
  });
});
