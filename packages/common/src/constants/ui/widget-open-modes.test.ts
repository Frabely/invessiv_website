import { describe, expect, it } from "vitest";
import { WidgetOpenMode } from "./widget-open-modes";

describe("WidgetOpenMode", () => {
  it("contains the four unique interaction modes", () => {
    expect(WidgetOpenMode).toEqual({
      Dialog: "dialog",
      Expand: "expand",
      Dock: "dock",
      None: "none",
    });
    expect(new Set(Object.values(WidgetOpenMode)).size).toBe(4);
  });
});
