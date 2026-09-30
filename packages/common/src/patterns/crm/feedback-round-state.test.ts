import { describe, expect, it } from "vitest";
import {
  FEEDBACK_ROUND_STATUS_VALUES,
  FeedbackRoundStatus,
  type FeedbackRoundStatus as Status,
} from "../../constants/crm/feedback-round-statuses";
import {
  FEEDBACK_TRANSITION_SIDE_VALUES,
  FeedbackTransitionSide,
} from "../../constants/crm/feedback-transition-sides";
import {
  canTransition,
  feedbackQuota,
  feedbackRoundProgress,
  feedbackRoundStepPosition,
  isActiveFeedbackRound,
  isAtFeedbackStep,
} from "./feedback-round-state";

const S = FeedbackRoundStatus;
const { Internal, Customer } = FeedbackTransitionSide;

// Written out from the table in plans/crm/16-feedbackrunden/58-datenmodell-und-fundament.md,
// independently of FEEDBACK_ROUND_TRANSITIONS, so a changed constant fails here.
const ALLOWED = new Set([
  `null>${S.Open}>${Internal}`,
  `${S.Open}>${S.Submitted}>${Customer}`,
  `${S.Open}>${S.Approved}>${Customer}`,
  `${S.Submitted}>${S.InDiscussion}>${Internal}`,
  `${S.Submitted}>${S.InProgress}>${Internal}`,
  `${S.InDiscussion}>${S.InProgress}>${Internal}`,
  `${S.Submitted}>${S.Open}>${Internal}`,
  `${S.InDiscussion}>${S.Open}>${Internal}`,
  `${S.InProgress}>${S.Completed}>${Internal}`,
  `${S.Completed}>${S.Approved}>${Customer}`,
]);

describe("canTransition", () => {
  const combinations = [null, ...FEEDBACK_ROUND_STATUS_VALUES].flatMap((from) =>
    FEEDBACK_ROUND_STATUS_VALUES.flatMap((to) =>
      FEEDBACK_TRANSITION_SIDE_VALUES.map((side) => [from, to, side] as const),
    ),
  );

  it("covers every status pair for both sides", () => {
    expect(combinations).toHaveLength(7 * 6 * 2);
  });

  it.each(combinations)("%s → %s by %s follows the table", (from, to, side) => {
    expect(canTransition(from, to, side)).toBe(
      ALLOWED.has(`${from}>${to}>${side}`),
    );
  });

  it("never leaves an approved round", () => {
    for (const to of FEEDBACK_ROUND_STATUS_VALUES)
      for (const side of FEEDBACK_TRANSITION_SIDE_VALUES)
        expect(canTransition(S.Approved, to, side)).toBe(false);
  });
});

describe("isActiveFeedbackRound", () => {
  it("treats open up to in progress as active", () => {
    const active = FEEDBACK_ROUND_STATUS_VALUES.filter(isActiveFeedbackRound);
    expect(active).toEqual([S.Open, S.Submitted, S.InDiscussion, S.InProgress]);
  });
});

describe("feedbackQuota", () => {
  const round = (roundNumber: number, status: Status) => ({
    roundNumber,
    status,
  });

  it("has nothing used without rounds", () => {
    expect(feedbackQuota({ included: 2, rounds: [] })).toEqual({
      included: 2,
      used: 0,
      remaining: 2,
      activeRoundNumber: null,
      approvedRoundNumber: null,
    });
  });

  it("counts a running first round as used", () => {
    expect(feedbackQuota({ included: 2, rounds: [round(1, S.Open)] })).toEqual({
      included: 2,
      used: 1,
      remaining: 1,
      activeRoundNumber: 1,
      approvedRoundNumber: null,
    });
  });

  it("uses the highest round number for several rounds", () => {
    expect(
      feedbackQuota({
        included: 3,
        rounds: [round(2, S.Completed), round(1, S.Completed)],
      }),
    ).toEqual({
      included: 3,
      used: 2,
      remaining: 1,
      activeRoundNumber: null,
      approvedRoundNumber: null,
    });
  });

  it("never reports a negative remainder", () => {
    expect(
      feedbackQuota({ included: 1, rounds: [round(2, S.InProgress)] })
        .remaining,
    ).toBe(0);
  });

  it("forfeits the remaining rounds after an approval", () => {
    expect(
      feedbackQuota({
        included: 4,
        rounds: [round(1, S.Completed), round(2, S.Approved)],
      }),
    ).toEqual({
      included: 4,
      used: 2,
      remaining: 0,
      activeRoundNumber: null,
      approvedRoundNumber: 2,
    });
  });
});

describe("feedbackRoundProgress", () => {
  it("is empty without rounds", () => {
    expect(feedbackRoundProgress([])).toEqual({
      activeRoundNumber: null,
      completedRoundNumber: null,
      approvedRoundNumber: null,
    });
  });

  it("names the running round next to the last completed one", () => {
    expect(
      feedbackRoundProgress([
        { roundNumber: 1, status: S.Completed },
        { roundNumber: 2, status: S.Submitted },
      ]),
    ).toEqual({
      activeRoundNumber: 2,
      completedRoundNumber: 1,
      approvedRoundNumber: null,
    });
  });

  it("reports the approval round", () => {
    expect(
      feedbackRoundProgress([
        { roundNumber: 1, status: S.Completed },
        { roundNumber: 2, status: S.Approved },
      ]),
    ).toEqual({
      activeRoundNumber: null,
      completedRoundNumber: 1,
      approvedRoundNumber: 2,
    });
  });
});

describe("isAtFeedbackStep", () => {
  const processSteps = ["Onboarding", "Design", "Entwicklung", "Launch"];
  const at = (
    currentProcessStep: string,
    feedbackRoundPositions: number[],
    roundNumber = 1,
  ) =>
    isAtFeedbackStep({
      processSteps,
      currentProcessStep,
      feedbackRoundPositions,
      roundNumber,
    });

  it("uses the first step for a round in front of every step", () => {
    expect(at("Onboarding", [0])).toBe(true);
    expect(at("Design", [0])).toBe(false);
  });

  it("uses the step right before a round in the middle", () => {
    expect(at("Entwicklung", [3, 3])).toBe(true);
    expect(at("Entwicklung", [3, 3], 2)).toBe(true);
    expect(at("Design", [3, 3])).toBe(false);
  });

  it("picks the round by its order, not by the stored order", () => {
    expect(at("Design", [3, 2], 1)).toBe(true);
    expect(at("Entwicklung", [3, 2], 2)).toBe(true);
  });

  it("uses the last step for a round at the end", () => {
    expect(at("Launch", [4])).toBe(true);
    expect(at("Entwicklung", [4])).toBe(false);
  });

  it("is never at a round the track does not have", () => {
    expect(at("Onboarding", [])).toBe(false);
    expect(at("Entwicklung", [3], 2)).toBe(false);
    expect(at("Entwicklung", [3], 0)).toBe(false);
  });
});

describe("feedbackRoundStepPosition", () => {
  it("clamps positions into the steps like the track does", () => {
    expect(feedbackRoundStepPosition([9], 4, 1)).toBe(4);
    expect(feedbackRoundStepPosition([2], 4, 2)).toBeNull();
  });
});
