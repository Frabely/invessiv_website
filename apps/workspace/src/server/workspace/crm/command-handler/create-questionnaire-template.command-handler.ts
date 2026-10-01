import "server-only";

import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { CreateQuestionnaireTemplateRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-template-request.dto";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { QuestionnaireCommandResult } from "@invessiv/common/contracts/crm/questionnaire/results/questionnaire-command-result";
import { questionnaireTemplates } from "@invessiv/db/record-configuration";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";
import { questionnaireTemplateService } from "@/server/workspace/crm/services/questionnaire/questionnaire-template-service";

/** An empty, active template; the blocks are chosen in the template editor. */
export async function createQuestionnaireTemplate(
  input: CreateQuestionnaireTemplateRequestDto,
): Promise<QuestionnaireCommandResult<QuestionnaireTemplateDto>> {
  const parsed = questionnaireCommandSupport.parse(
    questionnaireSchemas.createTemplate,
    input,
  );
  if (!parsed.ok) return parsed.result;

  return questionnaireCommandSupport.run(async (tx) => {
    const [row] = await tx
      .insert(questionnaireTemplates)
      .values({
        id: crypto.randomUUID(),
        title: parsed.data.title,
        description: parsed.data.description,
        status: QuestionnaireCatalogStatus.Active,
        version: 1,
      })
      .returning();
    return {
      ok: true,
      value: await questionnaireTemplateService.toDto(tx, row),
    };
  });
}
