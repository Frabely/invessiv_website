import { describe, expect, it } from "vitest";

import { FeedbackApiPath } from "./feedback-api-paths";

describe("FeedbackApiPath", () => {
  it("contains the exact path segments without duplicates", () => {
    expect(FeedbackApiPath).toEqual({
      FeedbackRounds: "feedback-rounds",
      Feedback: "feedback",
      Draft: "draft",
      Submit: "submit",
      Approve: "approve",
      Items: "items",
      Files: "files",
    });
    const values = Object.values(FeedbackApiPath);
    expect(new Set(values).size).toBe(values.length);
  });
});
