import "server-only";

import type { QuestionnaireBlockListDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-list.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { QuestionnaireCatalogListFilters } from "@/common/contracts/crm/questionnaire/questionnaire-catalog-list-filters";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import { questionnaireMappingService } from "@/server/shared/services/questionnaire/questionnaire-mapping-service";

/**
 * The catalog is small and the missing-locale badge needs every text of a block, so the list
 * loads full blocks in one batch instead of paging.
 */
export async function listQuestionnaireBlocks(
  filters: QuestionnaireCatalogListFilters,
): Promise<QuestionnaireBlockListDto> {
  const db = getDrizzleDatabaseClient();
  const blocks = await questionnaireDefinitionReadService.listCatalogBlocks(
    db,
    filters,
  );
  const [usage, hasBlocks] = await Promise.all([
    questionnaireDefinitionReadService.countTemplateUsage(
      db,
      blocks.map((block) => block.id),
    ),
    blocks.length > 0
      ? true
      : questionnaireDefinitionReadService.hasCatalogBlocks(db),
  ]);

  return {
    hasBlocks,
    rows: blocks.map((block) =>
      questionnaireMappingService.toBlockSummaryDto(
        block,
        usage.get(block.id) ?? 0,
      ),
    ),
  };
}
