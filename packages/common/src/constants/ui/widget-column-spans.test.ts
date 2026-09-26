import { describe, expect, it } from "vitest";
import { WidgetColumnSpan } from "./widget-column-spans";

describe("WidgetColumnSpan", () => {
  it("contains unique supported widths for the twelve-column grid", () => {
    expect(WidgetColumnSpan).toEqual({
      Three: 3,
      Four: 4,
      Six: 6,
      Eight: 8,
      Full: 12,
    });
    expect(new Set(Object.values(WidgetColumnSpan)).size).toBe(5);
  });
});
