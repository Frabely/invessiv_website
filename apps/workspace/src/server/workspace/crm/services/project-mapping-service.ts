import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { projects } from "@invessiv/db/record-configuration/crm/projects";

type ProjectRow = typeof projects.$inferSelect;

function toDto(row: ProjectRow): ProjectDto {
  return {
    id: row.id,
    customerId: row.customer_id,
    ownerMemberId: row.owner_member_id,
    title: row.title,
    status: row.status,
    phase: row.phase,
    processSteps: row.process_steps,
    currentProcessStep: row.current_process_step,
    workflowKey: row.workflow_key,
    billingModel: row.billing_model,
    includedFeedbackRounds: row.included_feedback_rounds,
    previewUrl: row.preview_url,
    nextStepLabel: row.next_step_label,
    nextStepDueOn: row.next_step_due_on,
    startedOn: row.started_on,
    budgetCents: row.budget_cents,
    hourlyRateCents: row.hourly_rate_cents,
    version: row.version,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export const projectMappingService = { toDto } as const;
