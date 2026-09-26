import { describe, expect, it } from "vitest";
import {
  PORTAL_WIDGET_KEY_VALUES,
  PortalWidgetKey,
} from "./portal-widget-keys";

describe("PortalWidgetKey", () => {
  it("lists every key once in the values array", () => {
    expect(PORTAL_WIDGET_KEY_VALUES).toEqual(Object.values(PortalWidgetKey));
    expect(new Set(PORTAL_WIDGET_KEY_VALUES).size).toBe(
      PORTAL_WIDGET_KEY_VALUES.length,
    );
  });
});
