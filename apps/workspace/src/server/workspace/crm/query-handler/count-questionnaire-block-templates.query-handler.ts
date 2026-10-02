import "server-only";

import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";

/** How many templates use a catalog block; a used block can be archived but not deleted. */
export async function countQuestionnaireBlockTemplates(
  blockId: string,
): Promise<number> {
  if (!isUuid(blockId)) return 0;
  const usage = await questionnaireDefinitionReadService.countTemplateUsage(
    getDrizzleDatabaseClient(),
    [blockId],
  );
  return usage.get(blockId) ?? 0;
}
