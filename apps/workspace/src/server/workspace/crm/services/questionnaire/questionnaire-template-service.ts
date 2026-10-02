import "server-only";

import { and, count, desc, eq, ilike, type SQL } from "drizzle-orm";

import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { QuestionnaireTemplateListDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-list.dto";
import type {
  ContactDatabaseTransaction,
  ContactDatabaseReader,
} from "@invessiv/db/core";
import {
  questionnaireTemplateBlocks,
  questionnaireTemplates,
} from "@invessiv/db/record-configuration";
import { QuestionnaireCatalogStatusFilter } from "@/common/constants/crm/questionnaire/questionnaire-catalog-status-filters";
import type { QuestionnaireCatalogListFilters } from "@/common/contracts/crm/questionnaire/questionnaire-catalog-list-filters";
import { escapeLikePattern } from "@/common/patterns/crm/sql-like-escape";
import type { QuestionnaireTemplateRow } from "@/server/shared/services/questionnaire/questionnaire-definition-types";
import { questionnaireMappingService } from "@/server/shared/services/questionnaire/questionnaire-mapping-service";

async function toDto(
  executor: ContactDatabaseReader,
  row: QuestionnaireTemplateRow,
): Promise<QuestionnaireTemplateDto> {
  const blocks = await executor
    .select({
      block_id: questionnaireTemplateBlocks.block_id,
      position: questionnaireTemplateBlocks.position,
    })
    .from(questionnaireTemplateBlocks)
    .where(eq(questionnaireTemplateBlocks.template_id, row.id));
  return questionnaireMappingService.toTemplateDto(row, blocks);
}

async function findTemplate(
  executor: ContactDatabaseReader,
  templateId: string,
): Promise<QuestionnaireTemplateDto | null> {
  const [row] = await executor
    .select()
    .from(questionnaireTemplates)
    .where(eq(questionnaireTemplates.id, templateId))
    .limit(1);
  return row ? toDto(executor, row) : null;
}

/** Locks the template for a write; the version is compared under this lock. */
async function lockTemplate(
  tx: ContactDatabaseTransaction,
  templateId: string,
): Promise<QuestionnaireTemplateRow | null> {
  const [row] = await tx
    .select()
    .from(questionnaireTemplates)
    .where(eq(questionnaireTemplates.id, templateId))
    .limit(1)
    .for("update");
  return row ?? null;
}

async function listTemplates(
  executor: ContactDatabaseReader,
  filters: QuestionnaireCatalogListFilters,
): Promise<QuestionnaireTemplateListDto> {
  const conditions: SQL[] = [];
  if (filters.status !== QuestionnaireCatalogStatusFilter.All)
    conditions.push(eq(questionnaireTemplates.status, filters.status));
  if (filters.search)
    conditions.push(
      ilike(
        questionnaireTemplates.title,
        `%${escapeLikePattern(filters.search)}%`,
      ),
    );

  const rows = await executor
    .select({
      template: questionnaireTemplates,
      blockCount: count(questionnaireTemplateBlocks.block_id),
    })
    .from(questionnaireTemplates)
    .leftJoin(
      questionnaireTemplateBlocks,
      eq(questionnaireTemplateBlocks.template_id, questionnaireTemplates.id),
    )
    .where(and(...conditions))
    .groupBy(questionnaireTemplates.id)
    .orderBy(desc(questionnaireTemplates.updated_at));
  const [any] =
    rows.length > 0
      ? rows
      : await executor
          .select({ id: questionnaireTemplates.id })
          .from(questionnaireTemplates)
          .limit(1);

  return {
    hasTemplates: any !== undefined,
    rows: rows.map((row) =>
      questionnaireMappingService.toTemplateSummaryDto(
        row.template,
        row.blockCount,
      ),
    ),
  };
}

/** The list order becomes the position; the old selection is removed first, so no position collides. */
async function replaceBlocks(
  tx: ContactDatabaseTransaction,
  templateId: string,
  blockIds: readonly string[],
): Promise<void> {
  await tx
    .delete(questionnaireTemplateBlocks)
    .where(eq(questionnaireTemplateBlocks.template_id, templateId));
  if (blockIds.length === 0) return;
  await tx.insert(questionnaireTemplateBlocks).values(
    blockIds.map((blockId, position) => ({
      template_id: templateId,
      block_id: blockId,
      position,
    })),
  );
}

export const questionnaireTemplateService = {
  findTemplate,
  listTemplates,
  lockTemplate,
  replaceBlocks,
  toDto,
} as const;
