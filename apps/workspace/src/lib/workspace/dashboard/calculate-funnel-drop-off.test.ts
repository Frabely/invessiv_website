import { describe, expect, it } from "vitest";
import { calculateFunnelDropOff } from "./calculate-funnel-drop-off";

describe("calculateFunnelDropOff", () => {
  it("returns null when previous stage count is 0", () => {
    expect(calculateFunnelDropOff(5, 0)).toBeNull();
  });

  it("returns null when both stages are 0", () => {
    expect(calculateFunnelDropOff(0, 0)).toBeNull();
  });

  it("returns 1 when no leads dropped off", () => {
    expect(calculateFunnelDropOff(10, 10)).toBe(1);
  });

  it("returns 0 when all leads dropped off", () => {
    expect(calculateFunnelDropOff(0, 10)).toBe(0);
  });

  it("computes ratio of current to previous", () => {
    expect(calculateFunnelDropOff(3, 10)).toBeCloseTo(0.3, 5);
    expect(calculateFunnelDropOff(7, 10)).toBeCloseTo(0.7, 5);
  });

  it("clamps to 1 when later stage count exceeds previous (data drift)", () => {
    expect(calculateFunnelDropOff(12, 10)).toBe(1);
  });
});
