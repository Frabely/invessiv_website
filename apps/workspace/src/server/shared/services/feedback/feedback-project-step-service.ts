import "server-only";

import { eq } from "drizzle-orm";

import {
  feedbackRoundStepPosition,
  isNextFeedbackRoundAdjacent,
} from "@invessiv/common/patterns/crm/feedback-round-state";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";

/**
 * Moves the project behind a finished round. Completion keeps the step when the next round sits
 * immediately after it; approval always advances. A round after the last step leaves it unchanged.
 * The project lock also protects the handover and project editor against a changed step list.
 */
async function advancePastFeedbackRound(
  tx: ContactDatabaseTransaction,
  projectId: string,
  roundNumber: number,
  forCompletion = false,
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
  if (
    forCompletion &&
    isNextFeedbackRoundAdjacent(
      project.feedbackRoundPositions ?? [],
      project.processSteps.length,
      roundNumber,
    )
  )
    return;
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
