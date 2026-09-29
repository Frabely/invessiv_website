import { describe, expect, it } from "vitest";
import {
  normalizeFeedbackRoundPositions,
  sortFeedbackRoundPositions,
} from "@invessiv/common/patterns/crm/feedback-round-positions";

describe("sortFeedbackRoundPositions", () => {
  it("sorts numerically and keeps duplicate positions", () => {
    expect(sortFeedbackRoundPositions([10, 2, 3, 2])).toEqual([2, 2, 3, 10]);
  });

  it("does not mutate its input", () => {
    const positions = [3, 1];
    sortFeedbackRoundPositions(positions);
    expect(positions).toEqual([3, 1]);
  });
});

describe("normalizeFeedbackRoundPositions", () => {
  it("clamps positions into the step list and sorts them", () => {
    expect(normalizeFeedbackRoundPositions([9, -2, 1], 3)).toEqual([0, 1, 3]);
  });
});
