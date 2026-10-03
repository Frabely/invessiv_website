import "server-only";

import { and, eq } from "drizzle-orm";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { questionnaireDefinitionValidation } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-definition-validation";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { questionnaireBlocks } from "@invessiv/db/record-configuration";
import { questionnaireDefinitionReadService as readService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import type {
  QuestionnaireBlockOwner,
  QuestionnaireBlockRow,
} from "@/server/shared/services/questionnaire/questionnaire-definition-types";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";
import { versionConflict } from "@/server/workspace/shared/version-conflict";
import type {
  OpenedQuestionnaireBlock,
  QuestionnaireBlockResult,
} from "./questionnaire-write-types";

const BLOCK_NOT_FOUND = {
  ok: false,
  code: QuestionnaireErrorCode.BlockNotFound,
} as const;
const FIELD_NOT_FOUND = {
  ok: false,
  code: QuestionnaireErrorCode.FieldNotFound,
} as const;

/** Every write on a block and its fields holds this lock, so invariants are checked on a stable block. */
async function lockBlock(
  tx: ContactDatabaseTransaction,
  blockId: string,
  owner: QuestionnaireBlockOwner,
): Promise<QuestionnaireBlockRow | null> {
  const [row] = await tx
    .select()
    .from(questionnaireBlocks)
    .where(
      and(
        eq(questionnaireBlocks.id, blockId),
        readService.ownerCondition(owner),
      ),
    )
    .limit(1)
    .for("update");
  return row ?? null;
}

function blockConflict(block: QuestionnaireBlockDto): QuestionnaireBlockResult {
  return versionConflict(block.version, block);
}

/** Locks and loads the block; a stale version answers with the current block for the editor. */
async function openBlock(
  tx: ContactDatabaseTransaction,
  blockId: string,
  owner: QuestionnaireBlockOwner,
  expectedVersion: number,
): Promise<OpenedQuestionnaireBlock> {
  if (!(await lockBlock(tx, blockId, owner)))
    return { ok: false, result: BLOCK_NOT_FOUND };
  const block = (await readService.findBlock(tx, blockId, owner))!;
  if (block.version !== expectedVersion)
    return { ok: false, result: blockConflict(block) };
  return { ok: true, block };
}

/** Like `openBlock`, for commands that address a field: the block is the one the field sits in. */
async function openBlockOfField(
  tx: ContactDatabaseTransaction,
  fieldId: string,
  owner: QuestionnaireBlockOwner,
  expectedVersion: number,
): Promise<OpenedQuestionnaireBlock> {
  const blockId = await readService.findFieldBlockId(tx, fieldId, owner);
  if (!blockId) return { ok: false, result: FIELD_NOT_FOUND };
  return openBlock(tx, blockId, owner, expectedVersion);
}

/** The block version is the one counter the editor compares; every write on the block bumps it. */
async function finishBlock(
  tx: ContactDatabaseTransaction,
  block: QuestionnaireBlockDto,
  owner: QuestionnaireBlockOwner,
  patch: Partial<
    Pick<QuestionnaireBlockRow, "key" | "carry_over" | "status">
  > = {},
): Promise<QuestionnaireBlockResult> {
  await updateLockedVersioned(
    {
      tx,
      table: questionnaireBlocks,
      id: block.id,
      expectedVersion: block.version,
      patch,
    },
    "Questionnaire block changed while it was locked",
  );
  return {
    ok: true,
    value: (await readService.findBlock(tx, block.id, owner))!,
  };
}

function invalid(
  code: NonNullable<
    ReturnType<typeof questionnaireDefinitionValidation.validateBlock>
  >,
): QuestionnaireBlockResult {
  return { ok: false, code };
}

/** Rebuilds the block with one level replaced; the level is the block or one group's children. */
function withSiblings(
  block: QuestionnaireBlockDto,
  parentFieldId: string | null,
  siblings: QuestionnaireFieldDto[],
): QuestionnaireBlockDto {
  if (parentFieldId === null) return { ...block, fields: siblings };
  return {
    ...block,
    fields: block.fields.map((field) =>
      field.id === parentFieldId ? { ...field, children: siblings } : field,
    ),
  };
}

export const questionnaireBlockSession = {
  FIELD_NOT_FOUND,
  blockConflict,
  finishBlock,
  invalid,
  lockBlock,
  openBlock,
  openBlockOfField,
  withSiblings,
} as const;
