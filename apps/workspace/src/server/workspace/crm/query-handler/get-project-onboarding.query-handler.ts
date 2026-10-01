import "server-only";

import type { ProjectOnboardingDto } from "@invessiv/common/contracts/crm/onboarding/project-onboarding.dto";
import { isOnboardingProjectEligible } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { onboardingFormAccessService } from "@/server/workspace/crm/services/onboarding/onboarding-form-access-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { onboardingPrefillService } from "@/server/workspace/crm/services/onboarding/onboarding-prefill-service";

/**
 * Onboarding state of one project. `null` means out of reach: unknown and foreign projects give
 * the same answer. Whether a start is possible is decided by the rules the start command enforces,
 * so the UI never offers a start the server would refuse.
 */
export async function getProjectOnboarding(
  projectId: string,
  actor: WorkspaceActor,
): Promise<ProjectOnboardingDto | null> {
  if (!onboardingFormSchemas.entityId.safeParse(projectId).success) return null;
  const db = getDrizzleDatabaseClient();
  const project = await onboardingFormAccessService.findReadableProject(
    db,
    projectId,
    actor,
  );
  if (!project) return null;

  const [form, prefillAvailable] = await Promise.all([
    onboardingFormAccessService.findFormOfProject(db, project.id),
    onboardingPrefillService.hasSource(db, project.customerId, actor),
  ]);
  const projectEligible = isOnboardingProjectEligible(project.status);

  return {
    projectId: project.id,
    form: form ? await onboardingFormReadService.toSummaryDto(db, form) : null,
    canStart:
      form === null &&
      projectEligible &&
      onboardingFormAccessService.canWrite(actor, {
        customerId: project.customerId,
        projectId: project.id,
      }),
    projectEligible,
    prefillAvailable,
  };
}
