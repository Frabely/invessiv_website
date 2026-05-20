import { beforeEach, describe, expect, it, vi } from "vitest";
import { isOpenableUrl, openExternalUrl } from "./is-openable-url";

describe("isOpenableUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isOpenableUrl("https://example.com")).toBe(true);
    expect(isOpenableUrl("http://example.com")).toBe(true);
  });

  it("rejects empty and non-web URLs", () => {
    expect(isOpenableUrl("")).toBe(false);
    expect(isOpenableUrl("   ")).toBe(false);
    expect(isOpenableUrl("mailto:test@example.com")).toBe(false);
    expect(isOpenableUrl("ftp://example.com")).toBe(false);
    expect(isOpenableUrl("not-a-url")).toBe(false);
  });
});

describe("openExternalUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("open", vi.fn());
  });

  it("opens valid web urls in a new tab", () => {
    openExternalUrl("https://example.com");

    expect(globalThis.open).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("does nothing for invalid urls", () => {
    openExternalUrl("not-a-url");

    expect(globalThis.open).not.toHaveBeenCalled();
  });
});
