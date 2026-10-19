import { describe, expect, it } from "vitest";
import { FeedbackAnswerProblem } from "./feedback-answer-problems";

describe("FeedbackAnswerProblem", () => {
  it("contains the exact problems without duplicates", () => {
    expect(FeedbackAnswerProblem).toEqual({
      Required: "required",
      TooLong: "tooLong",
      Conflict: "conflict",
      NotOpen: "notOpen",
      Failure: "failure",
    });
    const values = Object.values(FeedbackAnswerProblem);
    expect(new Set(values).size).toBe(values.length);
  });
});
