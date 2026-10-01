import "server-only";

import type { Locale } from "@invessiv/common";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { CreateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-block-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import {
  questionnaireBlocks,
  questionnaireBlockTranslations,
} from "@invessiv/db/record-configuration";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireDefinitionReadService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-read-service";
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
  const data = parsed.data;
  const texts = Object.entries(data.translations);
  if (texts.length === 0)
    return { ok: false, code: QuestionnaireErrorCode.TranslationRequired };

  return questionnaireCommandSupport.run(async (tx) => {
    if (
      await questionnaireDefinitionReadService.isCatalogKeyTaken(tx, data.key)
    )
      return { ok: false, code: QuestionnaireErrorCode.KeyTaken };
    const id = crypto.randomUUID();
    await tx.insert(questionnaireBlocks).values({
      id,
      owner_form_id: null,
      source_block_id: null,
      key: data.key,
      carry_over: data.carryOver,
      status: QuestionnaireCatalogStatus.Active,
      version: 1,
    });
    await tx.insert(questionnaireBlockTranslations).values(
      texts.map(([locale, text]) => ({
        block_id: id,
        locale: locale as Locale,
        title: text.title,
        intro: text.intro,
      })),
    );
    return {
      ok: true,
      value: (await questionnaireDefinitionReadService.findBlock(
        tx,
        id,
        null,
      ))!,
    };
  });
}
