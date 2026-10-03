import "server-only";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import { feedbackRoundProgress } from "@invessiv/common/patterns/crm/feedback-round-state";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { FeedbackRoundsViewModel } from "@/common/contracts/crm/feedback-rounds-view-model";
import { canOn } from "@/common/patterns/auth/can-on";
import { getFeedbackRound } from "@/server/workspace/crm/query-handler/get-feedback-round.query-handler";
import { listProjectFeedbackRounds } from "@/server/workspace/crm/query-handler/list-project-feedback-rounds.query-handler";

/**
 * Loads the rounds of the open project tab and, if the URL names one of them, its detail. A round
 * id of another project opens nothing, exactly like an unknown one.
 */
export async function buildFeedbackRoundsViewModel(options: {
  actor: WorkspaceActor;
  project: ProjectDto | null;
  requestedRoundId: string | null;
}): Promise<FeedbackRoundsViewModel | null> {
  const { actor, project, requestedRoundId } = options;
  if (!project) return null;
  const overview = await listProjectFeedbackRounds(project.id, actor);
  if (!overview) return null;
  const detail =
    requestedRoundId &&
    overview.rounds.some((round) => round.id === requestedRoundId)
      ? await getFeedbackRound(requestedRoundId, actor)
      : null;
  return {
    projectId: project.id,
    overview,
    detail,
    canWrite: canOn(actor, Permission.ProjectsWrite, {
      customerId: project.customerId,
      projectId: project.id,
    }),
    canReadFiles: canOn(actor, Permission.FilesRead, {
      customerId: project.customerId,
      projectId: project.id,
    }),
    defaultPreviewUrl: overview.rounds[0]?.previewUrl ?? project.previewUrl,
    roundProgress: feedbackRoundProgress(overview.rounds),
    processSteps: project.processSteps,
    feedbackRoundPositions: project.feedbackRoundPositions ?? [],
  };
}
