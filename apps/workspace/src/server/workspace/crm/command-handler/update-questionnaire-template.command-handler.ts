import "server-only";

import { and, inArray, isNull } from "drizzle-orm";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import type { UpdateQuestionnaireTemplateRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-template-request.dto";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  questionnaireBlocks,
  questionnaireTemplates,
} from "@invessiv/db/record-configuration";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";
import { questionnaireTemplateService } from "@/server/workspace/crm/services/questionnaire/questionnaire-template-service";
import { updateLockedVersioned } from "@/server/workspace/shared/update-versioned";

type TemplateResult = QuestionnaireCommandResult<QuestionnaireTemplateDto>;

/**
 * A template holds catalog blocks only. A block that is archived after it was chosen may stay,
 * so the template remains savable; adding an archived block is refused.
 */
async function checkBlocks(
  tx: ContactDatabaseTransaction,
  blockIds: readonly string[],
  current: QuestionnaireTemplateDto,
): Promise<TemplateResult | null> {
  if (blockIds.length === 0) return null;
  const rows = await tx
    .select({ id: questionnaireBlocks.id, status: questionnaireBlocks.status })
    .from(questionnaireBlocks)
    .where(
      and(
        inArray(questionnaireBlocks.id, [...blockIds]),
        isNull(questionnaireBlocks.owner_form_id),
      ),
    )
    .for("share");
  if (rows.length !== blockIds.length)
    return { ok: false, code: QuestionnaireErrorCode.BlockNotFound };

  const chosen = new Set(current.blocks.map((block) => block.blockId));
  const archivedAddition = blockIds.findIndex(
    (id) =>
      !chosen.has(id) &&
      rows.find((row) => row.id === id)?.status !==
        QuestionnaireCatalogStatus.Active,
  );
  if (archivedAddition === -1) return null;
  return {
    ok: false,
    code: QuestionnaireErrorCode.ValidationError,
    errors: [
      {
        code: "custom",
        path: ["blockIds", archivedAddition],
        message: "Only active catalog blocks can be added to a template",
        input: blockIds[archivedAddition],
      },
    ],
  };
}

export async function updateQuestionnaireTemplate(
  templateId: string,
  input: UpdateQuestionnaireTemplateRequestDto,
): Promise<TemplateResult> {
  if (!questionnaireSchemas.entityId.safeParse(templateId).success)
    return { ok: false, code: QuestionnaireErrorCode.TemplateNotFound };
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.updateTemplate,
    input,
  );
  if (!parsed.ok) return parsed.result;
  const data = parsed.data;

  return questionnaireCommandSupport.run(
    async (tx): Promise<TemplateResult> => {
      const row = await questionnaireTemplateService.lockTemplate(
        tx,
        templateId,
      );
      if (!row)
        return { ok: false, code: QuestionnaireErrorCode.TemplateNotFound };
      const current = await questionnaireTemplateService.toDto(tx, row);
      if (row.version !== data.version)
        return {
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          conflict: {
            code: ConcurrencyErrorCode.VersionConflict,
            currentVersion: row.version,
            current,
          },
        };
      const rejected = await checkBlocks(tx, data.blockIds, current);
      if (rejected) return rejected;

      const updated = await updateLockedVersioned(
        {
          tx,
          table: questionnaireTemplates,
          id: templateId,
          expectedVersion: row.version,
          patch: {
            title: data.title,
            description: data.description,
            status: data.status,
          },
        },
        "Questionnaire template changed while it was locked",
      );
      await questionnaireTemplateService.replaceBlocks(
        tx,
        templateId,
        data.blockIds,
      );
      return {
        ok: true,
        value: await questionnaireTemplateService.toDto(tx, updated),
      };
    },
  );
}
