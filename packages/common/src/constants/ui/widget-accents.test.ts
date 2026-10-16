import { describe, expect, it } from "vitest";
import { WIDGET_ACCENT_VALUES, WidgetAccent } from "./widget-accents";

describe("WidgetAccent", () => {
  it("contains the expected accents without duplicates", () => {
    expect(WIDGET_ACCENT_VALUES).toEqual([
      WidgetAccent.Blue,
      WidgetAccent.Sky,
      WidgetAccent.Teal,
      WidgetAccent.Green,
      WidgetAccent.Lime,
      WidgetAccent.Gold,
      WidgetAccent.Orange,
      WidgetAccent.Coral,
      WidgetAccent.Rose,
      WidgetAccent.Violet,
      WidgetAccent.Indigo,
    ]);
    expect(new Set(WIDGET_ACCENT_VALUES).size).toBe(
      WIDGET_ACCENT_VALUES.length,
    );
  });
});
