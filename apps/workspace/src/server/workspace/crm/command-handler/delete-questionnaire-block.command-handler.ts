import "server-only";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { DeleteQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-block-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionWriteService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-write-service";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

/**
 * Removes an unused catalog block for good and answers with the block as it was. A block in a
 * template answers `BLOCK_IN_USE` and can only be archived; copies in forms keep their content and
 * lose only their origin reference.
 */
export async function deleteQuestionnaireBlock(
  blockId: string,
  input: DeleteQuestionnaireBlockRequestDto,
): Promise<QuestionnaireCommandResult<QuestionnaireBlockDto>> {
  if (!questionnaireSchemas.entityId.safeParse(blockId).success)
    return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.deleteBlock,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return questionnaireCommandSupport.run((tx) =>
    questionnaireDefinitionWriteService.deleteBlock(
      tx,
      null,
      blockId,
      parsed.data.version,
    ),
  );
}
