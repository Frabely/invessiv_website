import "server-only";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import type { CreateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-field-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";
import { onboardingFormStructureService } from "@/server/workspace/crm/services/onboarding/onboarding-form-structure-service";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

/** A new last field or sub-field in a block of a form. */
export async function createOnboardingFormField(
  formId: string,
  blockId: string,
  input: CreateQuestionnaireFieldRequestDto,
  actor: WorkspaceActor,
): Promise<OnboardingCommandResult<QuestionnaireBlockDto>> {
  if (!onboardingFormSchemas.entityId.safeParse(blockId).success)
    return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.createField,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return onboardingFormStructureService.runDefinitionCommand(
    formId,
    actor,
    (tx, owner) =>
      questionnaireDefinitionWriteService.createField(
        tx,
        owner,
        blockId,
        parsed.data,
      ),
  );
}
