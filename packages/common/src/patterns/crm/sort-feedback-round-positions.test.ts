import { describe, expect, it } from "vitest";
import { sortFeedbackRoundPositions } from "@invessiv/common/patterns/crm/sort-feedback-round-positions";

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
