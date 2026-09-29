import { describe, expect, it } from "vitest";
import {
  keepsHandedOverRoundPositions,
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

describe("keepsHandedOverRoundPositions", () => {
  const steps = ["Design", "Entwicklung", "Launch"];
  const keeps = (
    after: { processSteps?: string[]; positions: number[] },
    handedOverRounds = 1,
  ) =>
    keepsHandedOverRoundPositions({
      before: { processSteps: steps, positions: [1, 2] },
      after: {
        processSteps: after.processSteps ?? steps,
        positions: after.positions,
      },
      handedOverRounds,
    });

  it("allows anything while no round was handed over", () => {
    expect(keeps({ positions: [] }, 0)).toBe(true);
  });

  it("allows moving and removing rounds after the handed-over ones", () => {
    expect(keeps({ positions: [1, 3] })).toBe(true);
    expect(keeps({ positions: [1] })).toBe(true);
    expect(keeps({ positions: [1, 1, 2] })).toBe(true);
  });

  it("allows edits to steps that do not border a handed-over round", () => {
    expect(
      keeps({
        processSteps: ["Design", "Entwicklung", "Go-live"],
        positions: [1, 2],
      }),
    ).toBe(true);
  });

  it("refuses removing or moving a handed-over round", () => {
    expect(keeps({ positions: [] })).toBe(false);
    expect(keeps({ positions: [2, 2] })).toBe(false);
    expect(keeps({ positions: [1, 2] }, 2)).toBe(true);
    expect(keeps({ positions: [1, 3] }, 2)).toBe(false);
  });

  it("refuses a new round in front of a handed-over one, which would renumber it", () => {
    expect(keeps({ positions: [0, 1, 2] })).toBe(false);
  });

  it("refuses changing or reordering the neighbouring steps", () => {
    expect(
      keeps({
        processSteps: ["Konzept", "Entwicklung", "Launch"],
        positions: [1, 2],
      }),
    ).toBe(false);
    expect(
      keeps({
        processSteps: ["Entwicklung", "Design", "Launch"],
        positions: [1, 2],
      }),
    ).toBe(false);
    expect(
      keeps({
        processSteps: ["Intro", "Design", "Entwicklung", "Launch"],
        positions: [2, 3],
      }),
    ).toBe(false);
  });

  it("refuses a new step after a round that sat at the end", () => {
    expect(
      keepsHandedOverRoundPositions({
        before: { processSteps: steps, positions: [3] },
        after: { processSteps: [...steps, "Wartung"], positions: [3] },
        handedOverRounds: 1,
      }),
    ).toBe(false);
  });
});
