import "server-only";

import { eq } from "drizzle-orm";

import { feedbackRoundStepPosition } from "@invessiv/common/patterns/crm/feedback-round-state";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";

/**
 * After an approval the project moves to the step right behind the approved round. A round behind
 * the last step leaves the track where it is. The project lock is the same one the handover and the
 * project editor take, so the step list cannot change underneath.
 */
async function advancePastFeedbackRound(
  tx: ContactDatabaseTransaction,
  projectId: string,
  roundNumber: number,
): Promise<void> {
  const [project] = await tx
    .select({
      version: projects.version,
      processSteps: projects.process_steps,
      currentProcessStep: projects.current_process_step,
      feedbackRoundPositions: projects.feedback_round_positions,
    })
    .from(projects)
    .where(eq(projects.id, projectId))
    .for("update");
  if (!project) throw new Error("Feedback round project is missing");
  const position = feedbackRoundStepPosition(
    project.feedbackRoundPositions ?? [],
    project.processSteps.length,
    roundNumber,
  );
  if (position === null || position >= project.processSteps.length) return;
  const nextStep = project.processSteps[position];
  if (nextStep === project.currentProcessStep) return;
  await updateLockedVersioned(
    {
      tx,
      table: projects,
      id: projectId,
      expectedVersion: project.version,
      patch: { current_process_step: nextStep },
    },
    "Locked feedback round project changed",
  );
}

export const feedbackProjectStepService = {
  advancePastFeedbackRound,
} as const;
