import { describe, expect, it } from "vitest";

import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { projectSchemas } from "@/server/workspace/crm/services/project-schemas";

function createInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Relaunch Website",
    status: ProjectStatus.Active,
    phase: ProjectPhase.Onboarding,
    processSteps: ["Onboarding", "Design", "Launch"],
    currentProcessStep: "Onboarding",
    billingModel: ProjectBillingModel.FixedPrice,
    feedbackRoundPositions: [2, 2],
    previewUrl: null,
    nextStepLabel: null,
    nextStepDueOn: null,
    startedOn: null,
    budgetCents: null,
    hourlyRateCents: null,
    ...overrides,
  };
}

const accepts = (feedbackRoundPositions: unknown) =>
  projectSchemas.create.safeParse(createInput({ feedbackRoundPositions }))
    .success;

describe("projectSchemas feedback rounds", () => {
  it("accepts no rounds, rounds at the start, in several gaps and at the end", () => {
    expect(accepts([])).toBe(true);
    expect(accepts([0])).toBe(true);
    expect(accepts([1, 2, 2, 3])).toBe(true);
  });

  it("accepts 20 rounds and rejects 21", () => {
    expect(accepts(Array.from({ length: 20 }, () => 3))).toBe(true);
    expect(accepts(Array.from({ length: 21 }, () => 3))).toBe(false);
  });

  it("rejects a position outside the step list", () => {
    expect(accepts([-1])).toBe(false);
    expect(accepts([4])).toBe(false);
    expect(accepts([1.5])).toBe(false);
  });

  it("sorts the positions so the round numbers follow the track order", () => {
    expect(
      projectSchemas.create.safeParse(
        createInput({ feedbackRoundPositions: [3, 0, 2] }),
      ).data?.feedbackRoundPositions,
    ).toEqual([0, 2, 3]);
  });

  it("applies the same rules to updates", () => {
    expect(
      projectSchemas.update.safeParse(
        createInput({ feedbackRoundPositions: [4], version: 1 }),
      ).success,
    ).toBe(false);
    expect(
      projectSchemas.update.safeParse(createInput({ version: 1 })).data,
    ).toMatchObject({ feedbackRoundPositions: [2, 2] });
  });
});
