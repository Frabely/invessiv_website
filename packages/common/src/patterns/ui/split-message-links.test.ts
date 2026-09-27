import { describe, expect, it } from "vitest";
import { splitMessageLinks } from "./split-message-links";

describe("splitMessageLinks", () => {
  it("recognises http links and keeps trailing punctuation outside", () => {
    expect(
      splitMessageLinks("Preview: https://example.test/a?b=1. Thanks"),
    ).toEqual([
      { kind: "text", value: "Preview: " },
      { kind: "link", value: "https://example.test/a?b=1" },
      { kind: "text", value: ". Thanks" },
    ]);
  });

  it("never turns markup or other schemes into links", () => {
    const text = '<img src=x onerror="alert(1)"> javascript:alert(1)';
    expect(splitMessageLinks(text)).toEqual([{ kind: "text", value: text }]);
  });

  it("returns nothing for an empty text", () => {
    expect(splitMessageLinks("")).toEqual([]);
  });
});
