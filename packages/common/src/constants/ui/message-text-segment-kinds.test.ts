import { describe, expect, it } from "vitest";
import { MessageTextSegmentKind } from "./message-text-segment-kinds";

describe("MessageTextSegmentKind", () => {
  it("defines distinct text segment kinds", () => {
    expect(MessageTextSegmentKind).toEqual({ Text: "text", Link: "link" });
    expect(new Set(Object.values(MessageTextSegmentKind)).size).toBe(
      Object.values(MessageTextSegmentKind).length,
    );
  });
});
