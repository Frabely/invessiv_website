import "server-only";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { DeleteQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-field-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

/** Forms hold copies, so a catalog field can go; one that triggers another field stays. */
export async function deleteQuestionnaireField(
  fieldId: string,
  input: DeleteQuestionnaireFieldRequestDto,
): Promise<QuestionnaireCommandResult<QuestionnaireBlockDto>> {
  if (!questionnaireSchemas.entityId.safeParse(fieldId).success)
    return { ok: false, code: QuestionnaireErrorCode.FieldNotFound };
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.deleteField,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return questionnaireCommandSupport.run((tx) =>
    questionnaireDefinitionWriteService.deleteField(
      tx,
      null,
      fieldId,
      parsed.data.expectedBlockVersion,
    ),
  );
}
