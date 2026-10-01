import "server-only";

import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { onboardingFormAccessService } from "@/server/workspace/crm/services/onboarding/onboarding-form-access-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

/**
 * A form with its block copies, answers and booked services, or null when it is out of reach.
 * File links follow `files.read`: without it the form is readable but shows no files.
 */
export async function getOnboardingForm(
  formId: string,
  actor: WorkspaceActor,
): Promise<OnboardingFormDto | null> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success) return null;
  const db = getDrizzleDatabaseClient();
  const form = await onboardingFormAccessService.findReadableForm(
    db,
    formId,
    actor,
  );
  return form
    ? onboardingFormReadService.toFormDto(
        db,
        form,
        fileAccessService.readableCondition(actor),
      )
    : null;
}
