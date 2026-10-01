import "server-only";

import type { CreateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-block-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

/** An empty, active catalog block; its fields are added in the block editor. */
export async function createQuestionnaireBlock(
  input: CreateQuestionnaireBlockRequestDto,
): Promise<QuestionnaireCommandResult<QuestionnaireBlockDto>> {
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.createBlock,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return questionnaireCommandSupport.run((tx) =>
    questionnaireDefinitionWriteService.createBlock(tx, null, parsed.data),
  );
}
