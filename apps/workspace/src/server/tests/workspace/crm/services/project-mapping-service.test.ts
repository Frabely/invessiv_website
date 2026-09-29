import { describe, expect, it } from "vitest";

import { ProjectBillingModel } from "@invessiv/common/constants/crm/project-billing-models";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { projectMappingService } from "@/server/workspace/crm/services/project-mapping-service";

const ROW = {
  id: "33333333-3333-4333-8333-333333333333",
  customer_id: "11111111-1111-4111-8111-111111111111",
  owner_member_id: "77777777-7777-4777-8777-777777777777",
  title: "Relaunch",
  status: ProjectStatus.Active,
  phase: ProjectPhase.Development,
  process_steps: ["Design", "Launch"],
  current_process_step: "Design",
  workflow_key: ProjectWorkflowKey.StandardWebV1,
  billing_model: ProjectBillingModel.FixedPrice,
  included_feedback_rounds: 2,
  feedback_round_positions: [1, 1] as number[] | null,
  preview_url: null,
  next_step_label: null,
  next_step_due_on: null,
  started_on: null,
  budget_cents: 5000,
  hourly_rate_cents: null,
  version: 3,
  created_at: new Date("2026-09-01T00:00:00.000Z"),
  updated_at: new Date("2026-09-02T00:00:00.000Z"),
};

describe("projectMappingService.toDto", () => {
  it("maps every column to its camelCase field", () => {
    expect(projectMappingService.toDto(ROW)).toEqual({
      id: ROW.id,
      customerId: ROW.customer_id,
      ownerMemberId: ROW.owner_member_id,
      title: "Relaunch",
      status: ProjectStatus.Active,
      phase: ProjectPhase.Development,
      processSteps: ["Design", "Launch"],
      currentProcessStep: "Design",
      workflowKey: ProjectWorkflowKey.StandardWebV1,
      billingModel: ProjectBillingModel.FixedPrice,
      includedFeedbackRounds: 2,
      feedbackRoundPositions: [1, 1],
      previewUrl: null,
      nextStepLabel: null,
      nextStepDueOn: null,
      startedOn: null,
      budgetCents: 5000,
      hourlyRateCents: null,
      version: 3,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-02T00:00:00.000Z",
    });
  });

  it("maps a project from before the rounds column to no rounds", () => {
    expect(
      projectMappingService.toDto({ ...ROW, feedback_round_positions: null })
        .feedbackRoundPositions,
    ).toEqual([]);
  });
});
