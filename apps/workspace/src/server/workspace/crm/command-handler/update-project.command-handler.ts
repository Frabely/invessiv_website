import "server-only";

import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import type { UpdateProjectRequestDto } from "@invessiv/common/contracts/crm/update-project-request.dto";
import type { VersionedWriteResult } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import { eq } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { projectMappingService } from "@/server/workspace/crm/services/project-mapping-service";
import { projectSchemas } from "@/server/workspace/crm/services/project-schemas";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

export async function updateProject(
  projectId: string,
  input: UpdateProjectRequestDto,
  actor: WorkspaceActor,
): Promise<VersionedWriteResult<ProjectDto> | ProjectErrorCode> {
  const parsed = projectSchemas.update.safeParse(input);
  if (!parsed.success || !projectSchemas.entityId.safeParse(projectId).success)
    return ProjectErrorCode.ValidationError;
  const db = getDrizzleDatabaseClient();
  const [target] = await db
    .select({ customerId: projects.customer_id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (
    !target ||
    !canOn(actor, Permission.ProjectsWrite, {
      customerId: target.customerId,
      projectId,
    })
  )
    return ProjectErrorCode.NotFound;
  const data = parsed.data;
  return db.transaction(async (tx) => {
    return await updateVersioned({
      tx,
      table: projects,
      id: projectId,
      expectedVersion: data.version,
      patch: {
        title: data.title,
        status: data.status,
        phase: data.phase,
        process_steps: data.processSteps,
        current_process_step: data.currentProcessStep,
        billing_model: data.billingModel,
        preview_url: data.previewUrl,
        next_step_label: data.nextStepLabel,
        next_step_due_on: data.nextStepDueOn,
        started_on: data.startedOn,
        budget_cents: data.budgetCents,
        hourly_rate_cents: data.hourlyRateCents,
      },
      toDto: projectMappingService.toDto,
    });
  });
}
