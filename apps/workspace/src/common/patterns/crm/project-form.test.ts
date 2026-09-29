import { describe, expect, it } from "vitest";

import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { ProjectProcessPlan } from "@/common/contracts/crm/project-process-plan";
import {
  createProjectFormValues,
  toCreateProjectRequest,
  toUpdateProjectRequest,
} from "@/common/patterns/crm/project-form";

const DEFAULT_PLAN: ProjectProcessPlan = {
  steps: ["Onboarding", "Launch"],
  feedbackRoundPositions: [1, 1],
  currentProcessStep: "Onboarding",
};

const PROJECT: ProjectDto = {
  id: "33333333-3333-4333-8333-333333333333",
  customerId: "11111111-1111-4111-8111-111111111111",
  ownerMemberId: "77777777-7777-4777-8777-777777777777",
  title: "Relaunch",
  status: ProjectStatus.Active,
  phase: ProjectPhase.Development,
  processSteps: ["Design", "Entwicklung", "Launch"],
  currentProcessStep: "Entwicklung",
  workflowKey: ProjectWorkflowKey.StandardWebV1,
  billingModel: ProjectBillingModel.Hourly,
  includedFeedbackRounds: 3,
  feedbackRoundPositions: [1, 2, 2],
  previewUrl: "https://preview.example.test",
  nextStepLabel: "Abnahme",
  nextStepDueOn: "2026-10-01",
  startedOn: "2026-09-01",
  budgetCents: 100000,
  hourlyRateCents: 9000,
  version: 4,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("createProjectFormValues", () => {
  it("starts a new project with the default plan", () => {
    expect(createProjectFormValues(null, DEFAULT_PLAN)).toEqual({
      title: "",
      status: ProjectStatus.Planned,
      plan: DEFAULT_PLAN,
    });
  });

  it("loads a stored project and an optional preselected step", () => {
    expect(
      createProjectFormValues(PROJECT, DEFAULT_PLAN, "Design"),
    ).toMatchObject({
      title: "Relaunch",
      plan: {
        steps: PROJECT.processSteps,
        feedbackRoundPositions: [1, 2, 2],
        currentProcessStep: "Design",
      },
    });
  });
});

describe("project requests", () => {
  it("keeps the stored phase when editing", () => {
    const values = createProjectFormValues(PROJECT, DEFAULT_PLAN);

    expect(toUpdateProjectRequest(values, PROJECT)).toMatchObject({
      phase: ProjectPhase.Development,
      billingModel: ProjectBillingModel.Hourly,
      previewUrl: "https://preview.example.test",
      budgetCents: 100000,
      version: 4,
    });
  });

  it("creates a project in onboarding with its round positions", () => {
    const values = {
      ...createProjectFormValues(null, DEFAULT_PLAN),
      title: " Neu ",
    };

    expect(toCreateProjectRequest(values)).toEqual({
      title: "Neu",
      status: ProjectStatus.Planned,
      phase: ProjectPhase.Onboarding,
      processSteps: ["Onboarding", "Launch"],
      currentProcessStep: "Onboarding",
      billingModel: ProjectBillingModel.FixedPrice,
      feedbackRoundPositions: [1, 1],
      previewUrl: null,
      nextStepLabel: null,
      nextStepDueOn: null,
      startedOn: null,
      budgetCents: null,
      hourlyRateCents: null,
    });
  });

  it("trims the step labels it sends", () => {
    const values = createProjectFormValues(PROJECT, DEFAULT_PLAN);
    values.plan = {
      ...values.plan,
      steps: [" Design ", "Entwicklung", "Launch"],
      currentProcessStep: " Design ",
    };

    expect(toUpdateProjectRequest(values, PROJECT)).toMatchObject({
      processSteps: ["Design", "Entwicklung", "Launch"],
      currentProcessStep: "Design",
    });
  });
});
