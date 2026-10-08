import { describe, expect, it } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";

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

  it("puts credentials between files and hours, behind their own read permission", () => {
    const keys = PORTAL_WIDGET_LAYOUT.map((entry) => entry.key);
    const index = keys.indexOf(PortalWidgetKey.Credentials);
    expect(keys[index - 1]).toBe(PortalWidgetKey.Files);
    expect(keys[index + 1]).toBe(PortalWidgetKey.Hours);
    expect(PORTAL_WIDGET_LAYOUT[index]).toMatchObject({
      order: 95,
      openMode: WidgetOpenMode.Dialog,
      mock: false,
      onlyWithContent: false,
      requiredPermission: Permission.PortalCredentialsRead,
      span: { mobile: 12, tablet: 6, desktop: 3 },
    });
  });

  it("stacks widgets on phones and gives the project card two thirds on desktop", () => {
    for (const entry of PORTAL_WIDGET_LAYOUT) {
      expect(entry.span.mobile).toBe(12);
    }
    const project = PORTAL_WIDGET_LAYOUT.find(
      (entry) => entry.key === PortalWidgetKey.Project,
    );
    expect(project?.span).toEqual({ mobile: 12, tablet: 12, desktop: 8 });
    const feedback = PORTAL_WIDGET_LAYOUT.find(
      (entry) => entry.key === PortalWidgetKey.Feedback,
    );
    expect(feedback?.span).toEqual({ mobile: 12, tablet: 6, desktop: 3 });
  });
});
