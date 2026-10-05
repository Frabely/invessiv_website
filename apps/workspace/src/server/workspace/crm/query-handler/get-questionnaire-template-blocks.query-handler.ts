import "server-only";

import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";

/** Loads the catalog blocks of a template with their full field structure in one batch. */
export async function getQuestionnaireTemplateBlocks(
  blockIds: readonly string[],
): Promise<QuestionnaireBlockDto[]> {
  return questionnaireDefinitionReadService.findBlocks(
    getDrizzleDatabaseClient(),
    blockIds,
    null,
  );
}
