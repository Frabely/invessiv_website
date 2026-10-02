import "server-only";

import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import { onboardingGroupEntryService } from "@/server/shared/services/onboarding/onboarding-group-entry-service";

/**
 * Removes an entry of a group together with its answers and file links. The files themselves stay
 * in the customer's files; only what tied them to the entry goes.
 */
export async function removePortalOnboardingGroupEntry(
  actor: PortalActor,
  target: { formId: string; entryId: string },
): Promise<PortalOnboardingResult<QuestionnaireGroupEntryDto[]>> {
  return portalOnboardingService.withLockedForm(
    actor,
    target.formId,
    async (tx, { form }) => {
      const entry = await portalOnboardingService.findWritableGroupEntry(
        tx,
        actor,
        form,
        target.entryId,
      );
      if (!entry.ok) return entry;
      await onboardingGroupEntryService.remove(tx, entry.value);
      return {
        ok: true,
        value: await portalOnboardingService.listGroupEntryDtos(
          tx,
          form.id,
          entry.value.field_id,
        ),
      };
    },
  );
}
