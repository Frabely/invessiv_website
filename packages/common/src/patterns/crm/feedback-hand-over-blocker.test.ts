import { describe, expect, it } from "vitest";
import { FeedbackHandOverBlocker } from "../../constants/crm/feedback-hand-over-blockers";
import { FeedbackRoundStatus } from "../../constants/crm/feedback-round-statuses";
import { ProjectStatus } from "../../constants/crm/project-statuses";
import { findFeedbackHandOverBlocker } from "./feedback-hand-over-blocker";

const ready = {
  projectStatus: ProjectStatus.Active,
  processSteps: ["Design", "Entwicklung", "Launch"],
  currentProcessStep: "Entwicklung",
  feedbackRoundPositions: [2, 2],
  includedFeedbackRounds: 2,
  rounds: [],
};

describe("findFeedbackHandOverBlocker", () => {
  it("allows the first round when the track stands right before it", () => {
    expect(findFeedbackHandOverBlocker(ready)).toBeNull();
  });

  it.each([
    ProjectStatus.Planned,
    ProjectStatus.Paused,
    ProjectStatus.Completed,
  ])("rejects a %s project", (projectStatus) => {
    expect(findFeedbackHandOverBlocker({ ...ready, projectStatus })).toBe(
      FeedbackHandOverBlocker.ProjectNotEligible,
    );
  });

  it("rejects every handover after the approval", () => {
    expect(
      findFeedbackHandOverBlocker({
        ...ready,
        rounds: [{ roundNumber: 1, status: FeedbackRoundStatus.Approved }],
      }),
    ).toBe(FeedbackHandOverBlocker.ProjectAlreadyApproved);
  });

  it.each([
    FeedbackRoundStatus.Open,
    FeedbackRoundStatus.Submitted,
    FeedbackRoundStatus.InDiscussion,
    FeedbackRoundStatus.InProgress,
  ])("rejects a second round while one is %s", (status) => {
    expect(
      findFeedbackHandOverBlocker({
        ...ready,
        rounds: [{ roundNumber: 1, status }],
      }),
    ).toBe(FeedbackHandOverBlocker.RoundAlreadyActive);
  });

  it("allows the next round after a completed one", () => {
    expect(
      findFeedbackHandOverBlocker({
        ...ready,
        rounds: [{ roundNumber: 1, status: FeedbackRoundStatus.Completed }],
      }),
    ).toBeNull();
  });

  it("rejects a round beyond the quota", () => {
    expect(
      findFeedbackHandOverBlocker({
        ...ready,
        rounds: [
          { roundNumber: 1, status: FeedbackRoundStatus.Completed },
          { roundNumber: 2, status: FeedbackRoundStatus.Completed },
        ],
      }),
    ).toBe(FeedbackHandOverBlocker.QuotaExhausted);
  });

  it("rejects a legacy track without round steps", () => {
    expect(
      findFeedbackHandOverBlocker({ ...ready, feedbackRoundPositions: null }),
    ).toBe(FeedbackHandOverBlocker.RoundStepMissing);
  });

  it("rejects a project that is not at the step before the round", () => {
    expect(
      findFeedbackHandOverBlocker({ ...ready, currentProcessStep: "Design" }),
    ).toBe(FeedbackHandOverBlocker.ProjectNotAtFeedbackStep);
  });
});
