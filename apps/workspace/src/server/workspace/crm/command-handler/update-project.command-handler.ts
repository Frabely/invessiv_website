import "server-only";

import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { UpdateProjectRequestDto } from "@invessiv/common/contracts/crm/update-project-request.dto";
import type { VersionedWriteResult } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import { projectMappingService } from "@/server/workspace/crm/services/project-mapping-service";
import { projectSchemas } from "@/server/workspace/crm/services/project-schemas";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

export async function updateProject(
  projectId: string,
  input: UpdateProjectRequestDto,
): Promise<VersionedWriteResult<ProjectDto> | null> {
  const parsed = projectSchemas.update.safeParse(input);
  if (!parsed.success || !projectSchemas.entityId.safeParse(projectId).success)
    return null;
  const data = parsed.data;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
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
