import "server-only";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import type { UpdateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-field-request.dto";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

/** Configuration, texts and options of a catalog field in one write. */
export async function updateQuestionnaireField(
  fieldId: string,
  input: UpdateQuestionnaireFieldRequestDto,
): Promise<QuestionnaireCommandResult<QuestionnaireBlockDto>> {
  if (!questionnaireSchemas.entityId.safeParse(fieldId).success)
    return { ok: false, code: QuestionnaireErrorCode.FieldNotFound };
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.updateField,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return questionnaireCommandSupport.run((tx) =>
    questionnaireDefinitionWriteService.updateField(
      tx,
      null,
      fieldId,
      parsed.data,
    ),
  );
}
