import "server-only";

import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import type { UpdateProjectRequestDto } from "@invessiv/common/contracts/crm/update-project-request.dto";
import type { VersionedWriteResult } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { feedbackRounds, projects } from "@invessiv/db/record-configuration";
import { eq, sql } from "drizzle-orm";
import { keepsHandedOverRoundPositions } from "@invessiv/common/patterns/crm/feedback-round-positions";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { canOn } from "@/common/patterns/auth/can-on";
import { announcePhaseChange } from "@/server/shared/services/message/announce-phase-change";
import { projectMappingService } from "@/server/workspace/crm/services/project-mapping-service";
import { projectSchemas } from "@/server/workspace/crm/services/project-schemas";
import { updateVersioned } from "@/server/workspace/shared/update-versioned";

/**
 * Phase and track before this write, read under the row lock that the update takes anyway. A value
 * read before the transaction could be stale and announce a change that never happened. The highest
 * handed-over round is read under the same lock, which the round handover takes as well.
 */
async function lockPreviousState(
  tx: ContactDatabaseTransaction,
  projectId: string,
) {
  const [row] = await tx
    .select({
      phase: projects.phase,
      processSteps: projects.process_steps,
      feedbackRoundPositions: projects.feedback_round_positions,
      handedOverRounds:
        sql<number>`(select coalesce(max(${feedbackRounds.round_number}), 0) from ${feedbackRounds} where ${feedbackRounds.project_id} = ${projects.id})`.mapWith(
          Number,
        ),
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .for("update");
  return row ?? null;
}

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
    const previous = await lockPreviousState(tx, projectId);
    if (
      previous?.handedOverRounds &&
      !keepsHandedOverRoundPositions({
        before: {
          processSteps: previous.processSteps,
          positions: previous.feedbackRoundPositions ?? [],
        },
        after: {
          processSteps: data.processSteps,
          positions:
            data.feedbackRoundPositions ??
            previous.feedbackRoundPositions ??
            [],
        },
        handedOverRounds: previous.handedOverRounds,
      })
    )
      return ProjectErrorCode.FeedbackRoundInUse;
    const result = await updateVersioned({
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
        ...(data.feedbackRoundPositions
          ? {
              included_feedback_rounds: data.feedbackRoundPositions.length,
              feedback_round_positions: data.feedbackRoundPositions,
            }
          : {}),
        preview_url: data.previewUrl,
        next_step_label: data.nextStepLabel,
        next_step_due_on: data.nextStepDueOn,
        started_on: data.startedOn,
        budget_cents: data.budgetCents,
        hourly_rate_cents: data.hourlyRateCents,
      },
      toDto: projectMappingService.toDto,
    });
    if (result.ok && data.phase !== previous?.phase)
      await announcePhaseChange(tx, target.customerId, data.title, data.phase);
    return result;
  });
}
