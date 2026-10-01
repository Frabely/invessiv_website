import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-block-request.dto";
import type { CreateQuestionnaireTemplateRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-template-request.dto";
import type { DeleteQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-block-request.dto";
import type { DuplicateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/duplicate-questionnaire-block-request.dto";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { UpdateQuestionnaireTemplateRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-template-request.dto";
import { questionnaireClientMutation } from "@/client/crm/questionnaire-client-mutation";
import { questionnaireDefinitionApiService } from "@/client/crm/questionnaire-definition-api-service";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import {
  crmQuestionnaireBlockDuplicateEndpoint,
  crmQuestionnaireBlockEndpoint,
  crmQuestionnaireBlockFieldsEndpoint,
  crmQuestionnaireFieldEndpoint,
  crmQuestionnaireFieldMoveEndpoint,
  crmQuestionnaireTemplateEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord } = versionedJsonMutationService;
const { isBlock, mutate } = questionnaireClientMutation;

function isTemplate(value: unknown): value is QuestionnaireTemplateDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    Array.isArray(value.blocks)
  );
}

function createBlock(request: CreateQuestionnaireBlockRequestDto) {
  return mutate(
    WorkspaceApiEndpoint.CrmQuestionnaireBlocks,
    HttpMethod.Post,
    request,
    isBlock,
  );
}

function deleteBlock(
  blockId: string,
  request: DeleteQuestionnaireBlockRequestDto,
) {
  return mutate(
    crmQuestionnaireBlockEndpoint(blockId),
    HttpMethod.Delete,
    request,
    isBlock,
  );
}

function duplicateBlock(
  blockId: string,
  request: DuplicateQuestionnaireBlockRequestDto,
) {
  return mutate(
    crmQuestionnaireBlockDuplicateEndpoint(blockId),
    HttpMethod.Post,
    request,
    isBlock,
  );
}

function createTemplate(request: CreateQuestionnaireTemplateRequestDto) {
  return mutate(
    WorkspaceApiEndpoint.CrmQuestionnaireTemplates,
    HttpMethod.Post,
    request,
    isTemplate,
  );
}

function updateTemplate(
  templateId: string,
  request: UpdateQuestionnaireTemplateRequestDto,
) {
  return mutate(
    crmQuestionnaireTemplateEndpoint(templateId),
    HttpMethod.Patch,
    request,
    isTemplate,
  );
}

/** The catalog's side of the owner-neutral block editor; a form's blocks pass their own paths. */
const definitionApi = questionnaireDefinitionApiService.forEndpoints({
  block: crmQuestionnaireBlockEndpoint,
  blockFields: crmQuestionnaireBlockFieldsEndpoint,
  field: crmQuestionnaireFieldEndpoint,
  fieldMove: crmQuestionnaireFieldMoveEndpoint,
});

export const questionnaireCatalogApiService = {
  createBlock,
  createTemplate,
  definitionApi,
  deleteBlock,
  duplicateBlock,
  updateTemplate,
} as const;
