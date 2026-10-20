import { describe, expect, it } from "vitest";
import { FeedbackClarificationPart } from "./feedback-clarification-parts";

describe("FeedbackClarificationPart", () => {
  it("contains the exact parts without duplicates", () => {
    expect(FeedbackClarificationPart).toEqual({
      Question: "question",
      Answer: "answer",
      Close: "close",
    });
    const values = Object.values(FeedbackClarificationPart);
    expect(new Set(values).size).toBe(values.length);
  });
});
