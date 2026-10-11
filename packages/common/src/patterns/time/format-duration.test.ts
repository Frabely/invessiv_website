import { describe, expect, it } from "vitest";

import { formatDuration } from "@invessiv/common/patterns/time/format-duration";

describe("formatDuration", () => {
  it.each([
    [0, "0:00"],
    [15, "0:15"],
    [59, "0:59"],
    [60, "1:00"],
    [90, "1:30"],
    [600, "10:00"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });

  it("marks a negative duration with a real minus sign", () => {
    expect(formatDuration(-60)).toBe("−1:00");
    expect(formatDuration(-90)).toBe("−1:30");
  });

  it("rejects fractions instead of rounding them", () => {
    expect(() => formatDuration(1.5)).toThrow(RangeError);
  });
});
