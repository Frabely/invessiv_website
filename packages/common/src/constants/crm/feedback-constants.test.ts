import { describe, expect, it } from "vitest";
import {
  FEEDBACK_ITEM_KIND_VALUES,
  FeedbackItemKind,
} from "./feedback-item-kinds";
import {
  FEEDBACK_ITEM_RESULT_VALUES,
  FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE,
  FeedbackItemResult,
} from "./feedback-item-results";
import {
  ACTIVE_FEEDBACK_ROUND_STATUS_VALUES,
  FEEDBACK_ROUND_STATUS_VALUES,
  FeedbackRoundStatus,
  INTERNAL_FEEDBACK_ROUND_TARGET_STATUS_VALUES,
  INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES,
  RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES,
  RESULT_VISIBLE_FEEDBACK_ROUND_STATUS_VALUES,
} from "./feedback-round-statuses";
import { FEEDBACK_ROUND_TRANSITIONS } from "./feedback-round-transitions";
import {
  FEEDBACK_TRANSITION_SIDE_VALUES,
  FeedbackTransitionSide,
} from "./feedback-transition-sides";
import {
  FEEDBACK_ROUND_ERROR_CODE_VALUES,
  FeedbackRoundErrorCode,
} from "./errors/feedback-round-error-codes";
import {
  FEEDBACK_HAND_OVER_BLOCKER_VALUES,
  FeedbackHandOverBlocker,
} from "./feedback-hand-over-blockers";
import {
  PORTAL_FEEDBACK_ERROR_CODE_VALUES,
  PortalFeedbackErrorCode,
} from "../portal/portal-feedback-error-codes";

describe("feedback const objects", () => {
  it.each([
    [FeedbackRoundStatus, FEEDBACK_ROUND_STATUS_VALUES],
    [FeedbackTransitionSide, FEEDBACK_TRANSITION_SIDE_VALUES],
    [FeedbackItemKind, FEEDBACK_ITEM_KIND_VALUES],
    [FeedbackItemResult, FEEDBACK_ITEM_RESULT_VALUES],
    [FeedbackRoundErrorCode, FEEDBACK_ROUND_ERROR_CODE_VALUES],
    [FeedbackHandOverBlocker, FEEDBACK_HAND_OVER_BLOCKER_VALUES],
  ] as const)("lists every value exactly once", (constObject, values) => {
    expect([...values]).toEqual(Object.values(constObject));
    expect(new Set(values).size).toBe(values.length);
  });

  it("uses only handover error codes as blockers", () => {
    for (const blocker of FEEDBACK_HAND_OVER_BLOCKER_VALUES)
      expect(FEEDBACK_ROUND_ERROR_CODE_VALUES).toContain(blocker);
  });

  it("keeps portal feedback error codes distinct", () => {
    const values = Object.values(PortalFeedbackErrorCode);
    expect(new Set(values).size).toBe(values.length);
    expect([...PORTAL_FEEDBACK_ERROR_CODE_VALUES]).toEqual(values);
  });
});

describe("feedback status groups", () => {
  it("splits the statuses into active, completed and approved", () => {
    expect(ACTIVE_FEEDBACK_ROUND_STATUS_VALUES).toEqual([
      "open",
      "submitted",
      "in_discussion",
      "in_progress",
    ]);
    expect(RESULT_VISIBLE_FEEDBACK_ROUND_STATUS_VALUES).toEqual([
      "completed",
      "approved",
    ]);
    expect([
      ...ACTIVE_FEEDBACK_ROUND_STATUS_VALUES,
      ...RESULT_VISIBLE_FEEDBACK_ROUND_STATUS_VALUES,
    ]).toEqual([...FEEDBACK_ROUND_STATUS_VALUES]);
  });

  it("queues only what the team has to act on", () => {
    expect(INTERNAL_QUEUE_FEEDBACK_ROUND_STATUS_VALUES).toEqual([
      "submitted",
      "in_discussion",
      "in_progress",
    ]);
  });

  it("owes the customer a reply for everything but implemented", () => {
    expect(FEEDBACK_ITEM_RESULTS_REQUIRING_NOTE).toEqual([
      "not_implemented",
      "additional_service",
    ]);
  });

  it("offers the team exactly the targets of its own transitions on a round", () => {
    const internalTargets = new Set(
      FEEDBACK_ROUND_TRANSITIONS.filter(
        (transition) =>
          transition.side === FeedbackTransitionSide.Internal &&
          transition.from !== null,
      ).map((transition) => transition.to),
    );
    expect(new Set(INTERNAL_FEEDBACK_ROUND_TARGET_STATUS_VALUES)).toEqual(
      internalTargets,
    );
  });

  it("lets results change only while the team works on a submitted round", () => {
    expect(RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES).toEqual([
      "submitted",
      "in_discussion",
      "in_progress",
    ]);
  });
});
