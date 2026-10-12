import "server-only";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import type { CreateProjectRequestDto } from "@invessiv/common/contracts/crm/create-project-request.dto";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { projects } from "@invessiv/db/record-configuration";
export async function insertProject(
  executor: Pick<ContactDatabaseTransaction, "insert">,
  customerId: string,
  ownerMemberId: string,
  data: CreateProjectRequestDto,
) {
  const [row] = await executor
    .insert(projects)
    .values({
      id: crypto.randomUUID(),
      customer_id: customerId,
      owner_member_id: ownerMemberId,
      title: data.title,
      status: data.status,
      phase: data.phase,
      process_steps: data.processSteps,
      current_process_step: data.currentProcessStep,
      workflow_key: ProjectWorkflowKey.StandardWebV1,
      billing_model: data.billingModel,
      included_feedback_rounds: data.feedbackRoundPositions.length,
      feedback_round_positions: data.feedbackRoundPositions,
      preview_url: data.previewUrl,
      next_step_label: data.nextStepLabel,
      next_step_due_on: data.nextStepDueOn,
      started_on: data.startedOn,
      budget_cents: data.budgetCents,
      hourly_rate_cents: data.hourlyRateCents,
      version: 1,
    })
    .returning();
  return row;
}
