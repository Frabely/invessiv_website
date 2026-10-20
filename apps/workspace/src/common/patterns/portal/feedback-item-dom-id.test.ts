import { describe, expect, it } from "vitest";
import { feedbackItemDomId } from "./feedback-item-dom-id";

describe("feedbackItemDomId", () => {
  it("derives the anchor from the item id, not from its position", () => {
    expect(feedbackItemDomId("a1b2")).toBe("feedback-item-a1b2");
  });
});
