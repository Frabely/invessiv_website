import "server-only";

import { eq } from "drizzle-orm";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { CreateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-block-request.dto";
import type { UpdateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-block-request.dto";
import { questionnaireDefinitionValidation } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-definition-validation";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  questionnaireBlocks,
  questionnaireBlockTranslations,
} from "@invessiv/db/record-configuration";
import { questionnaireDefinitionReadService as readService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import type { QuestionnaireBlockOwner } from "@/server/shared/services/questionnaire/questionnaire-definition-types";
import { questionnaireMappingService } from "@/server/shared/services/questionnaire/questionnaire-mapping-service";
import { questionnaireBlockSession as session } from "./questionnaire-block-session";
import type { QuestionnaireBlockResult } from "./questionnaire-write-types";

/** An empty, active block of `owner`; its fields are added afterwards. */
async function createBlock(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  input: CreateQuestionnaireBlockRequestDto,
): Promise<QuestionnaireBlockResult> {
  const texts = Object.entries(input.translations);
  if (texts.length === 0)
    return session.invalid(QuestionnaireErrorCode.TranslationRequired);
  if (await readService.isBlockKeyTaken(tx, owner, input.key))
    return session.invalid(QuestionnaireErrorCode.KeyTaken);

  const id = crypto.randomUUID();
  await tx.insert(questionnaireBlocks).values({
    id,
    owner_form_id: owner,
    source_block_id: null,
    key: input.key,
    carry_over: input.carryOver,
    status: QuestionnaireCatalogStatus.Active,
    version: 1,
  });
  await tx
    .insert(questionnaireBlockTranslations)
    .values(
      questionnaireMappingService.mapBlockTranslationsToRows(
        id,
        input.translations,
      ),
    );
  return { ok: true, value: (await readService.findBlock(tx, id, owner))! };
}

/**
 * Removes a block of `owner` for good and answers with it as it was. A block that a template
 * still lists answers `BLOCK_IN_USE`; only catalog blocks can be listed, so that never applies to
 * the blocks of a form.
 */
async function deleteBlock(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  blockId: string,
  expectedVersion: number,
): Promise<QuestionnaireBlockResult> {
  const opened = await session.openBlock(tx, blockId, owner, expectedVersion);
  if (!opened.ok) return opened.result;
  if ((await readService.countTemplateUsage(tx, [blockId])).has(blockId))
    return { ok: false, code: QuestionnaireErrorCode.BlockInUse };

  await tx
    .delete(questionnaireBlocks)
    .where(eq(questionnaireBlocks.id, blockId));
  return { ok: true, value: opened.block };
}

/** Blocks of a form are never archived, so their status is not taken from the request. */
async function updateBlock(
  tx: ContactDatabaseTransaction,
  owner: QuestionnaireBlockOwner,
  blockId: string,
  input: UpdateQuestionnaireBlockRequestDto,
): Promise<QuestionnaireBlockResult> {
  const opened = await session.openBlock(tx, blockId, owner, input.version);
  if (!opened.ok) return opened.result;
  if (
    input.key !== opened.block.key &&
    (await readService.isBlockKeyTaken(tx, owner, input.key))
  )
    return session.invalid(QuestionnaireErrorCode.KeyTaken);
  const next = { ...opened.block, translations: input.translations };
  const code = questionnaireDefinitionValidation.validateBlock(next);
  if (code) return session.invalid(code);

  await tx
    .delete(questionnaireBlockTranslations)
    .where(eq(questionnaireBlockTranslations.block_id, blockId));
  await tx
    .insert(questionnaireBlockTranslations)
    .values(
      questionnaireMappingService.mapBlockTranslationsToRows(
        blockId,
        input.translations,
      ),
    );
  return session.finishBlock(tx, opened.block, owner, {
    key: input.key,
    carry_over: input.carryOver,
    status: owner === null ? input.status : QuestionnaireCatalogStatus.Active,
  });
}

export const questionnaireBlockWriteService = {
  createBlock,
  deleteBlock,
  updateBlock,
} as const;
