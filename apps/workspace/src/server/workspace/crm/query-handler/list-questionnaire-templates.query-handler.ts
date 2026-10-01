import "server-only";

import type { QuestionnaireTemplateListDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-list.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import type { QuestionnaireCatalogListFilters } from "@/common/contracts/crm/questionnaire/questionnaire-catalog-list-filters";
import { questionnaireTemplateService } from "@/server/workspace/crm/services/questionnaire/questionnaire-template-service";

export async function listQuestionnaireTemplates(
  filters: QuestionnaireCatalogListFilters,
): Promise<QuestionnaireTemplateListDto> {
  return questionnaireTemplateService.listTemplates(
    getDrizzleDatabaseClient(),
    filters,
  );
}
