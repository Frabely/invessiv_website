import { describe, expect, it } from "vitest";

import {
  PORTAL_WIDGET_KEY_VALUES,
  PortalWidgetKey,
} from "./portal-widget-keys";
import { PORTAL_WIDGET_LAYOUT } from "./portal-widget-layout";

describe("PORTAL_WIDGET_LAYOUT", () => {
  it("registers every widget key exactly once, sorted by a unique order", () => {
    const keys = PORTAL_WIDGET_LAYOUT.map((entry) => entry.key);
    expect([...keys].sort()).toEqual([...PORTAL_WIDGET_KEY_VALUES].sort());

    const orders = PORTAL_WIDGET_LAYOUT.map((entry) => entry.order);
    expect(new Set(orders).size).toBe(orders.length);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("guards every real widget with a permission", () => {
    for (const entry of PORTAL_WIDGET_LAYOUT) {
      if (!entry.mock) expect(entry.requiredPermission).toBeTruthy();
    }
  });

  it("keeps widgets full width on phones and the project area full width everywhere", () => {
    for (const entry of PORTAL_WIDGET_LAYOUT) {
      expect(entry.span.mobile).toBe(12);
    }
    const project = PORTAL_WIDGET_LAYOUT.find(
      (entry) => entry.key === PortalWidgetKey.Project,
    );
    expect(project?.span).toEqual({ mobile: 12, tablet: 12, desktop: 12 });
  });
});
