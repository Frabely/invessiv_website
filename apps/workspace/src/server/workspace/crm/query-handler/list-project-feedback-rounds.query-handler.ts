import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ProjectFeedbackRoundsDto } from "@invessiv/common/contracts/crm/project-feedback-rounds.dto";
import { feedbackQuota } from "@invessiv/common/patterns/crm/feedback-round-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { accessScope } from "@/common/patterns/auth/access-scope";
import { canOn } from "@/common/patterns/auth/can-on";
import { feedbackRoundMappingService } from "@/server/workspace/crm/services/feedback/feedback-round-mapping-service";
import { feedbackRoundSchemas } from "@/server/workspace/crm/services/feedback/feedback-round-schemas";
import { feedbackRoundService } from "@/server/workspace/crm/services/feedback/feedback-round-service";
import { crmAccessCondition } from "@/server/workspace/shared/services/crm-access-condition";

/**
 * Quota, rounds and handover availability of one project. `null` means out of reach — unknown and
 * foreign projects give the same answer. The blocker is computed by the same rule the handover
 * command enforces, so the UI never offers a handover the server would refuse.
 */
export async function listProjectFeedbackRounds(
  projectId: string,
  actor: WorkspaceActor,
): Promise<ProjectFeedbackRoundsDto | null> {
  if (!feedbackRoundSchemas.entityId.safeParse(projectId).success) return null;
  const db = getDrizzleDatabaseClient();
  const project = await feedbackRoundService.findProjectTrack(
    db,
    projectId,
    crmAccessCondition.forScope(accessScope(actor, Permission.ProjectsRead), {
      customerId: projects.customer_id,
      projectId: projects.id,
    }),
  );
  if (!project) return null;

  const counted = await feedbackRoundService.listRounds(db, project.id);
  const rounds = counted.map(({ round, itemCount, unread }) =>
    feedbackRoundMappingService.toSummaryDto(round, itemCount, unread),
  );
  const quota = feedbackQuota({
    included: project.includedFeedbackRounds,
    rounds,
  });
  const blocker = feedbackRoundService.findHandOverBlocker(project, counted);
  const writable = canOn(actor, Permission.ProjectsWrite, {
    customerId: project.customerId,
    projectId: project.id,
  });

  return {
    projectId: project.id,
    quota,
    rounds,
    feedbackAreas: project.feedbackAreas,
    nextRoundNumber: quota.remaining > 0 ? quota.used + 1 : null,
    canHandOver: writable && blocker === null,
    handOverBlocker: blocker,
  };
}
