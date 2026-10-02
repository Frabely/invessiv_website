import "server-only";

import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";

/** A catalog block with every field and text; unknown ids and blocks of forms are `null`. */
export async function getQuestionnaireBlock(
  blockId: string,
): Promise<QuestionnaireBlockDto | null> {
  if (!isUuid(blockId)) return null;
  return questionnaireDefinitionReadService.findBlock(
    getDrizzleDatabaseClient(),
    blockId,
    null,
  );
}
