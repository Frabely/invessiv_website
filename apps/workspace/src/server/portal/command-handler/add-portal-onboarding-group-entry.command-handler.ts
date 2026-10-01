import "server-only";

import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { AddPortalOnboardingGroupEntryRequestDto } from "@invessiv/common/contracts/portal/add-portal-onboarding-group-entry-request.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalOnboardingSchemas } from "@/server/portal/services/onboarding/portal-onboarding-schemas";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import { onboardingGroupEntryService } from "@/server/shared/services/onboarding/onboarding-group-entry-service";

const VALIDATION = {
  ok: false,
  code: PortalOnboardingErrorCode.Validation,
} as const;

/**
 * Appends an entry to a group of a form the customer may edit. The id comes from the client, so
 * sub-field autosaves can address the entry at once: repeating the same add is a success, an id
 * that already belongs to another group or form is rejected, never taken over.
 */
export async function addPortalOnboardingGroupEntry(
  actor: PortalActor,
  formId: string,
  input: AddPortalOnboardingGroupEntryRequestDto,
): Promise<PortalOnboardingResult<QuestionnaireGroupEntryDto[]>> {
  const parsed = portalOnboardingSchemas.groupEntry.safeParse(input);
  if (!parsed.success) return VALIDATION;
  const { id, fieldId } = parsed.data;

  return portalOnboardingService.withLockedForm(
    actor,
    formId,
    async (tx, { form }) => {
      const field = await portalOnboardingService.findWritableField(
        tx,
        actor,
        form,
        { formId: form.id, fieldId, groupEntryId: null },
      );
      if (!field.ok) return field;
      if (field.value.type !== QuestionnaireFieldType.Group) return VALIDATION;

      const entries = await onboardingGroupEntryService.listOfField(
        tx,
        form.id,
        fieldId,
      );
      if (!entries.some((entry) => entry.id === id)) {
        if (await onboardingGroupEntryService.find(tx, id)) return VALIDATION;
        const limit =
          field.value.maxItems ?? QUESTIONNAIRE_LIMITS.groupEntriesPerField;
        if (entries.length >= limit)
          return { ok: false, code: PortalOnboardingErrorCode.LimitReached };
        await onboardingGroupEntryService.append(
          tx,
          { id, formId: form.id, fieldId },
          entries.length,
        );
      }
      return {
        ok: true,
        value: await portalOnboardingService.listGroupEntryDtos(
          tx,
          form.id,
          fieldId,
        ),
      };
    },
  );
}
