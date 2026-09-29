import { describe, expect, it } from "vitest";

import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProcessPlanMoveDirection } from "@/common/constants/crm/process-plan-move-directions";
import { ProcessPlanRowKind } from "@/common/constants/crm/process-plan-row-kinds";
import type { ProjectProcessPlan } from "@/common/contracts/crm/project-process-plan";
import {
  addCustomStep,
  createDefaultProcessPlan,
  insertFeedbackRoundAfter,
  moveProcessPlanRow,
  removeCustomStep,
  removeFeedbackRound,
  renameCustomStep,
  toProcessPlanRows,
} from "@/common/patterns/crm/project-process-plan";

function plan(overrides: Partial<ProjectProcessPlan> = {}): ProjectProcessPlan {
  return {
    steps: ["Design", "Entwicklung", "Launch"],
    feedbackRoundPositions: [2, 2],
    currentProcessStep: "Design",
    ...overrides,
  };
}

const rowLabels = (value: ProjectProcessPlan) =>
  toProcessPlanRows(value).map((row) =>
    row.kind === ProcessPlanRowKind.FeedbackRound
      ? `R${row.roundNumber}`
      : row.label,
  );

describe("createDefaultProcessPlan", () => {
  it("replaces the feedback phase with two single rounds before the launch", () => {
    const value = createDefaultProcessPlan((phase) => `label:${phase}`);

    expect(value.steps).not.toContain(`label:${ProjectPhase.Feedback}`);
    expect(value.steps).toHaveLength(5);
    expect(value.feedbackRoundPositions).toEqual([3, 3]);
    expect(value.steps[3]).toBe(`label:${ProjectPhase.Launch}`);
    expect(value.currentProcessStep).toBe(`label:${ProjectPhase.Onboarding}`);
  });
});

describe("toProcessPlanRows", () => {
  it("numbers the rounds in track order across several gaps", () => {
    expect(rowLabels(plan({ feedbackRoundPositions: [0, 1, 3] }))).toEqual([
      "R1",
      "Design",
      "R2",
      "Entwicklung",
      "Launch",
      "R3",
    ]);
  });

  it("renders only the steps without rounds", () => {
    expect(rowLabels(plan({ feedbackRoundPositions: [] }))).toEqual([
      "Design",
      "Entwicklung",
      "Launch",
    ]);
  });
});

describe("insertFeedbackRoundAfter", () => {
  it("inserts exactly one round directly after the chosen row", () => {
    const afterDesign = insertFeedbackRoundAfter(plan(), 0);
    expect(rowLabels(afterDesign)).toEqual([
      "Design",
      "R1",
      "Entwicklung",
      "R2",
      "R3",
      "Launch",
    ]);

    const afterRound = insertFeedbackRoundAfter(plan(), 3);
    expect(afterRound.feedbackRoundPositions).toEqual([2, 2, 2]);
  });

  it("stops at 20 rounds", () => {
    const full = plan({
      feedbackRoundPositions: Array.from({ length: 20 }, () => 3),
    });

    expect(insertFeedbackRoundAfter(full, 0)).toEqual(full);
  });
});

describe("removeFeedbackRound", () => {
  it("removes only the chosen round", () => {
    const value = removeFeedbackRound(
      plan({ feedbackRoundPositions: [1, 2] }),
      1,
    );

    expect(rowLabels(value)).toEqual(["Design", "Entwicklung", "R1", "Launch"]);
  });
});

describe("moveProcessPlanRow", () => {
  it("moves a round past a step and keeps it within the bounds", () => {
    const up = moveProcessPlanRow(plan(), 2, ProcessPlanMoveDirection.Up);
    expect(rowLabels(up)).toEqual([
      "Design",
      "R1",
      "Entwicklung",
      "R2",
      "Launch",
    ]);

    const top = plan({ feedbackRoundPositions: [0] });
    expect(moveProcessPlanRow(top, 0, ProcessPlanMoveDirection.Up)).toEqual(
      top,
    );
  });

  it("moves a step past rounds one row at a time", () => {
    const value = moveProcessPlanRow(plan(), 4, ProcessPlanMoveDirection.Up);

    expect(rowLabels(value)).toEqual([
      "Design",
      "Entwicklung",
      "R1",
      "Launch",
      "R2",
    ]);
  });
});

describe("custom step operations", () => {
  it("appends a step after trailing rounds, as the list shows it", () => {
    const value = addCustomStep(
      plan({ feedbackRoundPositions: [3] }),
      " Wartung ",
    );

    expect(rowLabels(value)).toEqual([
      "Design",
      "Entwicklung",
      "Launch",
      "R1",
      "Wartung",
    ]);
  });

  it("ignores a blank step", () => {
    expect(addCustomStep(plan(), "   ")).toEqual(plan());
  });

  it("keeps the rounds in place when a step before them disappears", () => {
    expect(rowLabels(removeCustomStep(plan(), 0))).toEqual([
      "Entwicklung",
      "R1",
      "R2",
      "Launch",
    ]);
  });

  it("keeps the last remaining step", () => {
    const single = plan({
      steps: ["Design"],
      currentProcessStep: "Design",
      feedbackRoundPositions: [1],
    });

    expect(removeCustomStep(single, 0)).toEqual(single);
  });

  it("falls back to the first step when removing the current one", () => {
    expect(removeCustomStep(plan(), 0).currentProcessStep).toBe("Entwicklung");
  });

  it("renames a step and follows it as current step", () => {
    const value = renameCustomStep(plan(), 0, "Gestaltung");

    expect(value.steps[0]).toBe("Gestaltung");
    expect(value.currentProcessStep).toBe("Gestaltung");
  });
});
