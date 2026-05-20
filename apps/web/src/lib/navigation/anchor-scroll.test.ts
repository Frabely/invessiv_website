import { describe, expect, it } from "vitest";

import { getAnchorScrollTop, getHashHref } from "./anchor-scroll";

describe("anchor-scroll", () => {
  it("keeps valid hash hrefs", () => {
    expect(getHashHref("#contact")).toBe("#contact");
    expect(getHashHref("#process")).toBe("#process");
  });

  it("rejects invalid hash hrefs", () => {
    expect(getHashHref(null)).toBeNull();
    expect(getHashHref("")).toBeNull();
    expect(getHashHref("#")).toBeNull();
    expect(getHashHref("/de#contact")).toBeNull();
  });

  it("calculates a non-negative anchor scroll position", () => {
    expect(getAnchorScrollTop(460, 220, 128)).toBe(552);
    expect(getAnchorScrollTop(40, 0, 128)).toBe(0);
  });
});
