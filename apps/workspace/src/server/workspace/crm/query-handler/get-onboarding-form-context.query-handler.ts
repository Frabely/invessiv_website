import "server-only";

import type { OnboardingFormContextDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-context.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormAccessService } from "@/server/workspace/crm/services/onboarding/onboarding-form-access-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

/** Customer, project and template of a form for the head of its page; null when the form is out of reach. */
export async function getOnboardingFormContext(
  formId: string,
  actor: WorkspaceActor,
): Promise<OnboardingFormContextDto | null> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success) return null;
  return onboardingFormAccessService.findReadableContext(
    getDrizzleDatabaseClient(),
    formId,
    actor,
  );
}
