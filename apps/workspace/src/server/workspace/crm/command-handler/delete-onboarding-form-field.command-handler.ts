import "server-only";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { DeleteQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-field-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { isOnboardingFormReleased } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { onboardingFormStructureService } from "@/server/workspace/crm/services/onboarding/onboarding-form-structure-service";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

/**
 * Removes a field of a form. Its answers and file links go with it; the files themselves stay in
 * the customer's file area.
 */
export async function deleteOnboardingFormField(
  formId: string,
  fieldId: string,
  input: DeleteQuestionnaireFieldRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<QuestionnaireBlockDto>> {
  if (!onboardingFormSchemas.entityId.safeParse(fieldId).success)
    return { ok: false, code: QuestionnaireErrorCode.FieldNotFound };
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.deleteField,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return onboardingFormStructureService.runDefinitionCommand(
    formId,
    actor,
    (tx, owner, form) =>
      questionnaireDefinitionWriteService.deleteField(
        tx,
        owner,
        fieldId,
        parsed.data.expectedBlockVersion,
        { keepLevelFilled: isOnboardingFormReleased(form.status) },
      ),
  );
}
