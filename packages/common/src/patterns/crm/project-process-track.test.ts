import { describe, expect, it } from "vitest";
import { ProcessTrackItemKind } from "@invessiv/common/constants/crm/process-track-item-kinds";
import { ProcessStepVariant } from "@invessiv/common/constants/ui/process-step-variants";
import type { ProjectProcessTrackInput } from "@invessiv/common/contracts/crm/project-process-track-input";
import {
  buildProjectProcessTrack,
  toProcessTrackSteps,
} from "@invessiv/common/patterns/crm/project-process-track";

const STEPS = ["Onboarding", "Design", "Entwicklung", "Launch"];
const R = (roundNumber: number) => `Feedbackrunde ${roundNumber}`;

function build(overrides: Partial<ProjectProcessTrackInput> = {}) {
  return buildProjectProcessTrack({
    processSteps: STEPS,
    currentProcessStep: "Design",
    feedbackRoundPositions: [3, 3],
    roundLabel: R,
    ...overrides,
  });
}

const labels = (track: ReturnType<typeof build>) =>
  track.items.map((item) => item.label);

const noProgress = {
  activeRoundNumber: null,
  completedRoundNumber: null,
  approvedRoundNumber: null,
};

describe("buildProjectProcessTrack", () => {
  it("keeps today's behaviour without rounds", () => {
    const track = build({ feedbackRoundPositions: [] });

    expect(labels(track)).toEqual(STEPS);
    expect(track.currentIndex).toBe(1);
    expect(
      track.items.every((item) => item.kind === ProcessTrackItemKind.Custom),
    ).toBe(true);
  });

  it("returns -1 for an unknown current step", () => {
    expect(build({ currentProcessStep: "Unbekannt" }).currentIndex).toBe(-1);
  });

  it("inserts each round at its own position and numbers them in order", () => {
    const track = build({ feedbackRoundPositions: [2, 3, 3] });

    expect(labels(track)).toEqual([
      "Onboarding",
      "Design",
      R(1),
      "Entwicklung",
      R(2),
      R(3),
      "Launch",
    ]);
    expect(track.items[2]).toEqual({
      key: "feedback-round-1",
      label: R(1),
      kind: ProcessTrackItemKind.FeedbackRound,
      roundNumber: 1,
    });
  });

  it("sorts unordered positions", () => {
    expect(labels(build({ feedbackRoundPositions: [3, 2] }))).toEqual([
      "Onboarding",
      "Design",
      R(1),
      "Entwicklung",
      R(2),
      "Launch",
    ]);
  });

  it("places rounds at the start and at the end", () => {
    expect(labels(build({ feedbackRoundPositions: [0, 4] }))).toEqual([
      R(1),
      ...STEPS,
      R(2),
    ]);
  });

  it("shows 20 rounds for the maximum", () => {
    const track = build({
      feedbackRoundPositions: Array.from({ length: 20 }, () => 3),
    });

    expect(track.items).toHaveLength(STEPS.length + 20);
    expect(track.items[22]?.label).toBe(R(20));
  });

  it("counts every round before the current step as done", () => {
    const track = build({
      feedbackRoundPositions: [2, 3, 3],
      currentProcessStep: "Entwicklung",
    });

    expect(track.currentIndex).toBe(3);
    expect(track.items[track.currentIndex]?.label).toBe("Entwicklung");
  });

  it("does not treat a free-text step called Feedback specially", () => {
    const track = build({
      processSteps: ["Design", "Feedback", "Launch"],
      currentProcessStep: "Feedback",
      feedbackRoundPositions: [],
    });

    expect(track.items[1]).toEqual({
      key: "step-1",
      label: "Feedback",
      kind: ProcessTrackItemKind.Custom,
    });
    expect(track.currentIndex).toBe(1);
  });

  it("highlights the running round regardless of the current step", () => {
    const track = build({
      feedbackRoundPositions: [2, 3, 3],
      currentProcessStep: "Onboarding",
      roundProgress: { ...noProgress, activeRoundNumber: 2 },
    });

    expect(track.items[track.currentIndex]?.label).toBe(R(2));
  });

  it("keeps completed rounds done while the work continues before the next round", () => {
    const track = build({
      feedbackRoundPositions: [2, 3, 3],
      currentProcessStep: "Design",
      roundProgress: { ...noProgress, completedRoundNumber: 1 },
    });

    expect(track.items[track.currentIndex]?.label).toBe("Entwicklung");
  });

  it("shows only the rounds up to the approval and marks them done", () => {
    const approved = build({
      feedbackRoundPositions: [2, 3, 3],
      currentProcessStep: "Launch",
      roundProgress: {
        ...noProgress,
        completedRoundNumber: 2,
        approvedRoundNumber: 2,
      },
    });

    expect(labels(approved)).toEqual([
      "Onboarding",
      "Design",
      R(1),
      "Entwicklung",
      R(2),
      "Launch",
    ]);
    expect(approved.items[approved.currentIndex]?.label).toBe("Launch");

    const approvedAtEnd = build({
      feedbackRoundPositions: [4],
      currentProcessStep: "Launch",
      roundProgress: { ...noProgress, approvedRoundNumber: 1 },
    });

    expect(approvedAtEnd.currentIndex).toBe(approvedAtEnd.items.length);
  });
});

describe("toProcessTrackSteps", () => {
  it("accents feedback rounds and keeps the item keys", () => {
    const steps = toProcessTrackSteps(build().items);

    expect(steps[0]).toEqual({
      key: "step-0",
      label: "Onboarding",
      variant: ProcessStepVariant.Default,
    });
    expect(steps[3]).toEqual({
      key: "feedback-round-1",
      label: R(1),
      variant: ProcessStepVariant.Accent,
    });
  });
});
