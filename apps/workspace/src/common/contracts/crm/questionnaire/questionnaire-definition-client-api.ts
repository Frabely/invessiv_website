import type { CreateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-field-request.dto";
import type { DeleteQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-field-request.dto";
import type { MoveQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/move-questionnaire-field-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { UpdateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-block-request.dto";
import type { UpdateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-field-request.dto";
import type { QuestionnaireClientResult } from "@/common/contracts/crm/questionnaire/questionnaire-client-result";

/**
 * The writes the block editor needs, injected by its owner: the catalog here, a form's block in
 * Task 65. Every call answers with the whole block, so order and conditions come from one source.
 */
export interface QuestionnaireDefinitionClientApi {
  updateBlock(
    blockId: string,
    request: UpdateQuestionnaireBlockRequestDto,
  ): Promise<QuestionnaireClientResult<QuestionnaireBlockDto>>;
  createField(
    blockId: string,
    request: CreateQuestionnaireFieldRequestDto,
  ): Promise<QuestionnaireClientResult<QuestionnaireBlockDto>>;
  updateField(
    fieldId: string,
    request: UpdateQuestionnaireFieldRequestDto,
  ): Promise<QuestionnaireClientResult<QuestionnaireBlockDto>>;
  deleteField(
    fieldId: string,
    request: DeleteQuestionnaireFieldRequestDto,
  ): Promise<QuestionnaireClientResult<QuestionnaireBlockDto>>;
  moveField(
    fieldId: string,
    request: MoveQuestionnaireFieldRequestDto,
  ): Promise<QuestionnaireClientResult<QuestionnaireBlockDto>>;
}
