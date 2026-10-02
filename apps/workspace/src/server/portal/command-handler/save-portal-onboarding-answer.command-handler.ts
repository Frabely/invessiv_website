import "server-only";

import {
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES,
  QUESTIONNAIRE_NON_ANSWER_ROW_TYPE_VALUES,
  QuestionnaireFieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { PortalOnboardingAnswerSavedDto } from "@invessiv/common/contracts/portal/portal-onboarding-answer-saved.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { SavePortalOnboardingAnswerRequestDto } from "@invessiv/common/contracts/portal/save-portal-onboarding-answer-request.dto";
import {
  normalizeQuestionnaireValue,
  validateQuestionnaireValue,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-field-value";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { portalOnboardingSchemas } from "@/server/portal/services/onboarding/portal-onboarding-schemas";
import { portalOnboardingService } from "@/server/portal/services/onboarding/portal-onboarding-service";
import { onboardingAnswerWriteService } from "@/server/shared/services/onboarding/onboarding-answer-write-service";
import type { OnboardingSlotContent } from "@/server/shared/services/onboarding/onboarding-form-types";

type Result = PortalOnboardingResult<PortalOnboardingAnswerSavedDto>;

const CHOICE_ANSWER_TYPES: readonly QuestionnaireFieldType[] =
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES;
const NON_ANSWER_ROW_TYPES: readonly QuestionnaireFieldType[] =
  QUESTIONNAIRE_NON_ANSWER_ROW_TYPE_VALUES;

/**
 * What the slot will hold, or null when the input does not fit the field: options of another
 * field, more options than allowed, a value that fails the field's own validation. Blank text
 * clears the slot; single-line values are stored trimmed.
 */
function toContent(
  field: QuestionnaireFieldDto,
  input: { values: string[] } | { choiceIds: string[] },
): OnboardingSlotContent | null {
  if (NON_ANSWER_ROW_TYPES.includes(field.type)) return null;

  if (CHOICE_ANSWER_TYPES.includes(field.type)) {
    if (!("choiceIds" in input)) return null;
    const known = new Set(field.choices.map((choice) => choice.id));
    const limit =
      field.type === QuestionnaireFieldType.MultiChoice
        ? (field.maxItems ?? QUESTIONNAIRE_LIMITS.choicesPerField)
        : 1;
    const fits =
      input.choiceIds.length <= limit &&
      input.choiceIds.every((choiceId) => known.has(choiceId));
    return fits ? { choiceIds: input.choiceIds } : null;
  }

  if (!("values" in input)) return null;
  const raw = input.values[0] ?? "";
  if (raw.trim() === "") return { values: [] };
  if (!validateQuestionnaireValue(field, raw).ok) return null;
  return { values: [normalizeQuestionnaireValue(field, raw)] };
}

/**
 * Replaces one slot of a form the customer may edit. Last write wins per field: the form version
 * is neither compared nor advanced, so two contacts filling different fields never collide.
 */
export async function savePortalOnboardingAnswer(
  actor: PortalActor,
  formId: string,
  input: SavePortalOnboardingAnswerRequestDto,
): Promise<Result> {
  const parsed = portalOnboardingSchemas.answer.safeParse(input);
  if (!parsed.success) return portalOnboardingService.validation();
  const slot = {
    fieldId: parsed.data.fieldId,
    groupEntryId: parsed.data.groupEntryId,
  };

  return portalOnboardingService.withLockedForm(
    actor,
    formId,
    async (tx, { form }) => {
      const target = { formId: form.id, ...slot };
      const field = await portalOnboardingService.findWritableField(
        tx,
        actor,
        form,
        target,
      );
      if (!field.ok) return field;
      const content = toContent(field.value, parsed.data);
      if (!content) return portalOnboardingService.validation();

      await onboardingAnswerWriteService.replaceSlot(
        tx,
        { slot: target, content },
        { portalMembershipId: actor.membershipId },
      );
      return {
        ok: true,
        value: await portalOnboardingService.toSavedDto(tx, actor),
      };
    },
  );
}
