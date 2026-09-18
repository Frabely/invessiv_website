import "server-only";

import type { CreateProjectRequestDto } from "@invessiv/common/contracts/crm/create-project-request.dto";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import { ProjectWorkflowKey } from "@invessiv/common/constants/crm/project-workflows";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers, projects } from "@invessiv/db/record-configuration";
import { eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { projectMappingService } from "@/server/workspace/crm/services/project-mapping-service";
import { projectSchemas } from "@/server/workspace/crm/services/project-schemas";

export async function createProject(
  customerId: string,
  input: CreateProjectRequestDto,
  actor: WorkspaceActor,
): Promise<ProjectDto | ProjectErrorCode> {
  const parsed = projectSchemas.create.safeParse(input);
  if (!parsed.success || !projectSchemas.entityId.safeParse(customerId).success)
    return ProjectErrorCode.ValidationError;
  if (!canOn(actor, Permission.ProjectsWrite, { customerId }))
    return ProjectErrorCode.NotFound;
  const db = getDrizzleDatabaseClient();
  const [customer] = await db
    .select({
      ownerMemberId: customers.owner_member_id,
      status: customers.status,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  if (!customer) return ProjectErrorCode.NotFound;
  if (customer.status === ProjectStatus.Archived)
    return ProjectErrorCode.ValidationError;
  const data = parsed.data;
  const [row] = await db
    .insert(projects)
    .values({
      id: crypto.randomUUID(),
      customer_id: customerId,
      owner_member_id: customer.ownerMemberId,
      title: data.title,
      status: data.status,
      phase: data.phase,
      process_steps: data.processSteps,
      current_process_step: data.currentProcessStep,
      workflow_key: ProjectWorkflowKey.StandardWebV1,
      billing_model: data.billingModel,
      included_feedback_rounds: 2,
      preview_url: data.previewUrl,
      next_step_label: data.nextStepLabel,
      next_step_due_on: data.nextStepDueOn,
      started_on: data.startedOn,
      budget_cents: data.budgetCents,
      hourly_rate_cents: data.hourlyRateCents,
      version: 1,
    })
    .returning();
  return row ? projectMappingService.toDto(row) : ProjectErrorCode.NotFound;
}
