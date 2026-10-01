import "server-only";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { MoveQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/move-questionnaire-field-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { onboardingFormStructureService } from "@/server/workspace/crm/services/onboarding/onboarding-form-structure-service";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

/** One step up or down among the fields of the same level of a block of a form. */
export async function moveOnboardingFormField(
  formId: string,
  fieldId: string,
  input: MoveQuestionnaireFieldRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<QuestionnaireBlockDto>> {
  if (!onboardingFormSchemas.entityId.safeParse(fieldId).success)
    return { ok: false, code: QuestionnaireErrorCode.FieldNotFound };
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.moveField,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return onboardingFormStructureService.runDefinitionCommand(
    formId,
    actor,
    (tx, owner) =>
      questionnaireDefinitionWriteService.moveField(
        tx,
        owner,
        fieldId,
        parsed.data.direction,
        parsed.data.expectedBlockVersion,
      ),
  );
}
