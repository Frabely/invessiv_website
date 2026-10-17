import { describe, expect, it } from "vitest";

import { hoursMeter } from "@invessiv/common/patterns/time/hours-meter";

describe("hoursMeter", () => {
  it("fills the bar by what was used of what is available", () => {
    expect(hoursMeter(150, 300)).toEqual({ max: 300, value: 150 });
  });

  it("caps an overdrawn bar at full", () => {
    expect(hoursMeter(360, 300)).toEqual({ max: 300, value: 300 });
  });

  it("keeps an empty or negative stock from producing an invalid bar", () => {
    expect(hoursMeter(60, 0)).toEqual({ max: 1, value: 1 });
    expect(hoursMeter(-30, -60)).toEqual({ max: 1, value: 0 });
  });
});
