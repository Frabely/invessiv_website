import { describe, expect, it } from "vitest";

import { getNavigationItem } from "./get-navigation-item";

describe("getNavigationItem", () => {
  it("uses the anchor for in-page and cross-page section links", () => {
    expect(getNavigationItem("#services")).toBe("services");
    expect(getNavigationItem("/de#process")).toBe("process");
  });

  it("uses the last route segment for page links", () => {
    expect(getNavigationItem("/en/references")).toBe("references");
    expect(getNavigationItem("/de/imprint?x=1")).toBe("imprint");
  });

  it("falls back to home for the locale root", () => {
    expect(getNavigationItem("/de")).toBe("home");
    expect(getNavigationItem("/")).toBe("home");
  });
});
