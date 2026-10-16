import { describe, expect, it } from "vitest";
import { WidgetOpenMode } from "./widget-open-modes";

describe("WidgetOpenMode", () => {
  it("contains the five unique interaction modes", () => {
    expect(WidgetOpenMode).toEqual({
      Dialog: "dialog",
      Expand: "expand",
      Dock: "dock",
      Page: "page",
      None: "none",
    });
    expect(new Set(Object.values(WidgetOpenMode)).size).toBe(5);
  });
});
