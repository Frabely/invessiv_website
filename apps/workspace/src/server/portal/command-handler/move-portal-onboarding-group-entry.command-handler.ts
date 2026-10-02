import "server-only";

import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { MovePortalOnboardingGroupEntryRequestDto } from "@invessiv/common/contracts/portal/move-portal-onboarding-group-entry-request.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalOnboardingSchemas } from "@/server/portal/services/onboarding/portal-onboarding-schemas";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import { onboardingGroupEntryService } from "@/server/shared/services/onboarding/onboarding-group-entry-service";

/** One step up or down within the group; past either end nothing changes. */
export async function movePortalOnboardingGroupEntry(
  actor: PortalActor,
  target: { formId: string; entryId: string },
  input: MovePortalOnboardingGroupEntryRequestDto,
): Promise<PortalOnboardingResult<QuestionnaireGroupEntryDto[]>> {
  const parsed = portalOnboardingSchemas.moveGroupEntry.safeParse(input);
  if (!parsed.success) return portalOnboardingService.validation();

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
      await onboardingGroupEntryService.move(
        tx,
        entry.value,
        parsed.data.direction,
      );
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
