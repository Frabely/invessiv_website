import { describe, expect, it } from "vitest";
import { HoursBalanceFigureKind } from "./hours-balance-figure-kinds";

describe("HoursBalanceFigureKind", () => {
  it("defines distinct keys for every balance figure", () => {
    expect(HoursBalanceFigureKind).toEqual({
      Purchased: "purchased",
      Used: "used",
      Allocated: "allocated",
      Free: "free",
      Goodwill: "goodwill",
      Remaining: "remaining",
    });
    const values = Object.values(HoursBalanceFigureKind);
    expect(new Set(values).size).toBe(values.length);
  });
});
