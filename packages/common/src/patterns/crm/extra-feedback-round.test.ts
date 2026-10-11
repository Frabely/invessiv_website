import { describe, expect, it } from "vitest";

import { ExtraFeedbackRoundBlocker } from "@invessiv/common/constants/crm/extra-feedback-round-blockers";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import {
  findExtraFeedbackRoundBlocker,
  nextExtraFeedbackRoundPosition,
} from "@invessiv/common/patterns/crm/extra-feedback-round";

const steps = ["Design", "Development", "Launch"];

describe("findExtraFeedbackRoundBlocker", () => {
  it("allows a further round while nothing is approved and the limit is not reached", () => {
    expect(
      findExtraFeedbackRoundBlocker({
        positions: [2, 2],
        rounds: [{ status: FeedbackRoundStatus.Completed }],
      }),
    ).toBeNull();
  });

  it("blocks once the project has an approved round", () => {
    expect(
      findExtraFeedbackRoundBlocker({
        positions: [2],
        rounds: [{ status: FeedbackRoundStatus.Approved }],
      }),
    ).toBe(ExtraFeedbackRoundBlocker.ProjectApproved);
  });

  it("blocks at twenty rounds", () => {
    expect(
      findExtraFeedbackRoundBlocker({
        positions: Array.from({ length: 20 }, () => 2),
        rounds: [],
      }),
    ).toBe(ExtraFeedbackRoundBlocker.LimitReached);
  });

  it("names the approval first when both apply", () => {
    expect(
      findExtraFeedbackRoundBlocker({
        positions: Array.from({ length: 20 }, () => 2),
        rounds: [{ status: FeedbackRoundStatus.Approved }],
      }),
    ).toBe(ExtraFeedbackRoundBlocker.ProjectApproved);
  });
});

describe("nextExtraFeedbackRoundPosition", () => {
  it("puts the round right behind the current step when the track has none", () => {
    expect(
      nextExtraFeedbackRoundPosition({
        processSteps: steps,
        currentProcessStep: "Design",
        positions: [],
      }),
    ).toBe(1);
  });

  it("puts the round behind the last one while rounds are still ahead", () => {
    expect(
      nextExtraFeedbackRoundPosition({
        processSteps: steps,
        currentProcessStep: "Development",
        positions: [2, 2],
      }),
    ).toBe(2);
  });

  it("puts the round behind the current step once the project moved past the last round", () => {
    expect(
      nextExtraFeedbackRoundPosition({
        processSteps: steps,
        currentProcessStep: "Launch",
        positions: [2, 2],
      }),
    ).toBe(3);
  });

  it("clamps stored positions into the step list before comparing", () => {
    expect(
      nextExtraFeedbackRoundPosition({
        processSteps: steps,
        currentProcessStep: "Design",
        positions: [9],
      }),
    ).toBe(3);
  });

  it("falls back to the last round when the current step is not in the list", () => {
    expect(
      nextExtraFeedbackRoundPosition({
        processSteps: steps,
        currentProcessStep: "Unknown",
        positions: [1],
      }),
    ).toBe(1);
  });
});
