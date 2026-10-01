import "server-only";

import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import { isUuid } from "@invessiv/common/patterns/validation/is-uuid";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { questionnaireTemplateService } from "@/server/workspace/crm/services/questionnaire/questionnaire-template-service";

/** Archived templates stay addressable; an unknown or malformed id is `null`, never a throw. */
export async function getQuestionnaireTemplate(
  templateId: string,
): Promise<QuestionnaireTemplateDto | null> {
  if (!isUuid(templateId)) return null;
  return questionnaireTemplateService.findTemplate(
    getDrizzleDatabaseClient(),
    templateId,
  );
}
