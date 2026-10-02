import "server-only";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { DuplicateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/duplicate-questionnaire-block-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import { questionnaireBlockCopyService } from "@/server/workspace/crm/services/questionnaire/questionnaire-block-copy-service";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

/** A deep copy under a new key; archived blocks can be duplicated, the copy starts active. */
export async function duplicateQuestionnaireBlock(
  blockId: string,
  input: DuplicateQuestionnaireBlockRequestDto,
): Promise<QuestionnaireCommandResult<QuestionnaireBlockDto>> {
  if (!questionnaireSchemas.entityId.safeParse(blockId).success)
    return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.duplicateBlock,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return questionnaireCommandSupport.run(async (tx) => {
    const source = await questionnaireDefinitionReadService.findBlock(
      tx,
      blockId,
      null,
    );
    if (!source)
      return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };
    if (
      await questionnaireDefinitionReadService.isBlockKeyTaken(
        tx,
        null,
        parsed.data.key,
      )
    )
      return { ok: false, code: QuestionnaireErrorCode.KeyTaken };

    const copyId = await questionnaireBlockCopyService.copyBlock(tx, source, {
      ownerFormId: null,
      key: parsed.data.key,
    });
    return {
      ok: true,
      value: (await questionnaireDefinitionReadService.findBlock(
        tx,
        copyId,
        null,
      ))!,
    };
  });
}
