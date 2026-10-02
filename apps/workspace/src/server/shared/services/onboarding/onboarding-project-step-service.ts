import "server-only";

import { eq } from "drizzle-orm";

import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import { announcePhaseChange } from "@/server/shared/services/message/announce-phase-change";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import type { OnboardingFormRow } from "./onboarding-form-types";

/**
 * After the completion a project still in the onboarding phase moves on to design. The track only
 * follows while it stands at its first step; a step someone already advanced stays. A project in
 * any other phase is left alone. The project lock is the one the project editor takes.
 */
async function advancePastOnboarding(
  tx: ContactDatabaseTransaction,
  form: Pick<OnboardingFormRow, "project_id" | "customer_id">,
): Promise<void> {
  const [project] = await tx
    .select({
      version: projects.version,
      title: projects.title,
      phase: projects.phase,
      processSteps: projects.process_steps,
      currentProcessStep: projects.current_process_step,
    })
    .from(projects)
    .where(eq(projects.id, form.project_id))
    .for("update");
  if (!project) throw new Error("Onboarding form without its project");
  if (project.phase !== ProjectPhase.Onboarding) return;
  const [firstStep, nextStep] = project.processSteps;
  await updateLockedVersioned(
    {
      tx,
      table: projects,
      id: form.project_id,
      expectedVersion: project.version,
      patch: {
        phase: ProjectPhase.Design,
        ...(nextStep !== undefined && project.currentProcessStep === firstStep
          ? { current_process_step: nextStep }
          : {}),
      },
    },
    "Locked onboarding project changed",
  );
  await announcePhaseChange(
    tx,
    form.customer_id,
    project.title,
    ProjectPhase.Design,
  );
}

export const onboardingProjectStepService = {
  advancePastOnboarding,
} as const;
