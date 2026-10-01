import {
  QUESTIONNAIRE_ERROR_CODE_VALUES,
  QuestionnaireErrorCode,
} from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-block-request.dto";
import type { CreateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-field-request.dto";
import type { CreateQuestionnaireTemplateRequestDto } from "@invessiv/common/contracts/crm/questionnaire/create-questionnaire-template-request.dto";
import type { DeleteQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-block-request.dto";
import type { DeleteQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/delete-questionnaire-field-request.dto";
import type { DuplicateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/duplicate-questionnaire-block-request.dto";
import type { MoveQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/move-questionnaire-field-request.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireTemplateDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template.dto";
import type { UpdateQuestionnaireBlockRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-block-request.dto";
import type { UpdateQuestionnaireFieldRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-field-request.dto";
import type { UpdateQuestionnaireTemplateRequestDto } from "@invessiv/common/contracts/crm/questionnaire/update-questionnaire-template-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import type { QuestionnaireClientResult } from "@/common/contracts/crm/questionnaire/questionnaire-client-result";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import {
  crmQuestionnaireBlockDuplicateEndpoint,
  crmQuestionnaireBlockEndpoint,
  crmQuestionnaireBlockFieldsEndpoint,
  crmQuestionnaireFieldEndpoint,
  crmQuestionnaireFieldMoveEndpoint,
  crmQuestionnaireTemplateEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord } = versionedJsonMutationService;

function isBlock(value: unknown): value is QuestionnaireBlockDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    Array.isArray(value.fields)
  );
}

function isTemplate(value: unknown): value is QuestionnaireTemplateDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    Array.isArray(value.blocks)
  );
}

function mutate<T>(
  url: string,
  method: HttpMethod,
  body: unknown,
  isValue: (value: unknown) => value is T,
): Promise<QuestionnaireClientResult<T>> {
  return versionedJsonMutationService.mutate(
    url,
    method,
    body,
    (payload) => (isValue(payload) ? payload : null),
    isValue,
    QUESTIONNAIRE_ERROR_CODE_VALUES,
    QuestionnaireErrorCode.Internal,
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

function updateBlock(
  blockId: string,
  request: UpdateQuestionnaireBlockRequestDto,
) {
  return mutate(
    crmQuestionnaireBlockEndpoint(blockId),
    HttpMethod.Patch,
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

function createField(
  blockId: string,
  request: CreateQuestionnaireFieldRequestDto,
) {
  return mutate(
    crmQuestionnaireBlockFieldsEndpoint(blockId),
    HttpMethod.Post,
    request,
    isBlock,
  );
}

function updateField(
  fieldId: string,
  request: UpdateQuestionnaireFieldRequestDto,
) {
  return mutate(
    crmQuestionnaireFieldEndpoint(fieldId),
    HttpMethod.Patch,
    request,
    isBlock,
  );
}

function deleteField(
  fieldId: string,
  request: DeleteQuestionnaireFieldRequestDto,
) {
  return mutate(
    crmQuestionnaireFieldEndpoint(fieldId),
    HttpMethod.Delete,
    request,
    isBlock,
  );
}

function moveField(fieldId: string, request: MoveQuestionnaireFieldRequestDto) {
  return mutate(
    crmQuestionnaireFieldMoveEndpoint(fieldId),
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

/** The catalog's side of the owner-neutral block editor; a form's blocks get their own in Task 65. */
const definitionApi: QuestionnaireDefinitionClientApi = {
  updateBlock,
  createField,
  updateField,
  deleteField,
  moveField,
};

export const questionnaireCatalogApiService = {
  createBlock,
  createTemplate,
  definitionApi,
  deleteBlock,
  duplicateBlock,
  updateTemplate,
} as const;
