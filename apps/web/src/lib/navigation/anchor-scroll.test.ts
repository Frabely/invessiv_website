import { describe, expect, it } from "vitest";

import {
  getAnchorScrollTop,
  getHashHref,
  getLayoutDocumentLeft,
  getLayoutDocumentTop,
} from "./anchor-scroll";

function createOffsetElement(
  offsetTop: number,
  offsetParent: HTMLElement | null,
  offsetLeft = 0,
) {
  return { offsetTop, offsetLeft, offsetParent } as unknown as HTMLElement;
}

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

  it("sums layout offsets across the offset parent chain", () => {
    const root = createOffsetElement(100, null);
    const parent = createOffsetElement(40, root);
    const target = createOffsetElement(8, parent);

    expect(getLayoutDocumentTop(target)).toBe(148);
    expect(getLayoutDocumentTop(root)).toBe(100);
  });

  it("sums horizontal layout offsets across the offset parent chain", () => {
    const root = createOffsetElement(0, null, 20);
    const target = createOffsetElement(0, root, 12);

    expect(getLayoutDocumentLeft(target)).toBe(32);
  });
});
