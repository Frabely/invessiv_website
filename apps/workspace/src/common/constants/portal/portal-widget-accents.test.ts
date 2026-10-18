import { describe, expect, it } from "vitest";
import { PORTAL_WIDGET_ACCENTS } from "./portal-widget-accents";
import { PORTAL_WIDGET_KEY_VALUES } from "./portal-widget-keys";

describe("PORTAL_WIDGET_ACCENTS", () => {
  it("gives every widget its own colour", () => {
    expect(Object.keys(PORTAL_WIDGET_ACCENTS).sort()).toEqual(
      [...PORTAL_WIDGET_KEY_VALUES].sort(),
    );
    const accents = Object.values(PORTAL_WIDGET_ACCENTS);
    expect(new Set(accents).size).toBe(accents.length);
  });
});
