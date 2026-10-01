import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { AddOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/add-onboarding-form-block-request.dto";
import type { MoveOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/move-onboarding-form-block-request.dto";
import type { OnboardingFieldUsageDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-field-usage.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { RemoveOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/remove-onboarding-form-block-request.dto";
import type { StartProjectOnboardingRequestDto } from "@invessiv/common/contracts/crm/onboarding/start-project-onboarding-request.dto";
import { questionnaireDefinitionApiService } from "@/client/crm/questionnaire-definition-api-service";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";
import type { OnboardingFormClientResult } from "@/common/contracts/crm/onboarding/onboarding-form-client-result";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import type { QuestionnaireOwnerErrorCodes } from "@/common/contracts/crm/questionnaire/questionnaire-owner-error-codes";
import {
  crmOnboardingFormBlockEndpoint,
  crmOnboardingFormBlockFieldsEndpoint,
  crmOnboardingFormBlockMoveEndpoint,
  crmOnboardingFormBlocksEndpoint,
  crmOnboardingFormEndpoint,
  crmOnboardingFormFieldEndpoint,
  crmOnboardingFormFieldMoveEndpoint,
  crmOnboardingFormFieldUsageEndpoint,
  crmProjectOnboardingEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord } = versionedJsonMutationService;

// What the block editor shows when its form, not its block, refuses a write.
const OWNER_CODES: QuestionnaireOwnerErrorCodes = {
  [OnboardingErrorCode.NotEditable]: QuestionnaireErrorCode.NotEditable,
  [OnboardingErrorCode.FormNotFound]: QuestionnaireErrorCode.BlockNotFound,
};

function isForm(value: unknown): value is OnboardingFormDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.status === "string" &&
    typeof value.version === "number" &&
    Array.isArray(value.blocks)
  );
}

function isUsage(value: unknown): value is OnboardingFieldUsageDto {
  return (
    isRecord(value) &&
    typeof value.answers === "number" &&
    typeof value.files === "number"
  );
}

/** One write whose answer is the whole form; a conflict carries the current one. */
function mutateForm(
  url: string,
  method: HttpMethod,
  body: unknown,
): Promise<OnboardingFormClientResult<OnboardingFormDto>> {
  return versionedJsonMutationService.mutate(
    url,
    method,
    body,
    (payload) => (isForm(payload) ? payload : null),
    isForm,
    ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES,
    OnboardingErrorCode.Internal,
  );
}

function read<T>(url: string, isValue: (value: unknown) => value is T) {
  return versionedJsonMutationService.read(
    url,
    (payload) => (isValue(payload) ? payload : null),
    ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES,
    OnboardingErrorCode.Internal,
  );
}

function start(projectId: string, request: StartProjectOnboardingRequestDto) {
  return mutateForm(
    crmProjectOnboardingEndpoint(projectId),
    HttpMethod.Post,
    request,
  );
}

function getForm(formId: string) {
  return read(crmOnboardingFormEndpoint(formId), isForm);
}

function addBlock(formId: string, request: AddOnboardingFormBlockRequestDto) {
  return mutateForm(
    crmOnboardingFormBlocksEndpoint(formId),
    HttpMethod.Post,
    request,
  );
}

function moveBlock(
  formId: string,
  blockId: string,
  request: MoveOnboardingFormBlockRequestDto,
) {
  return mutateForm(
    crmOnboardingFormBlockMoveEndpoint(formId, blockId),
    HttpMethod.Post,
    request,
  );
}

function removeBlock(
  formId: string,
  blockId: string,
  request: RemoveOnboardingFormBlockRequestDto,
) {
  return mutateForm(
    crmOnboardingFormBlockEndpoint(formId, blockId),
    HttpMethod.Delete,
    request,
  );
}

function getFieldUsage(formId: string, fieldId: string) {
  return read(crmOnboardingFormFieldUsageEndpoint(formId, fieldId), isUsage);
}

/**
 * A form's side of the owner-neutral block editor: the same client as the catalog, built from the
 * form's paths and the codes only a form answers with.
 */
function definitionApi(formId: string): QuestionnaireDefinitionClientApi {
  return questionnaireDefinitionApiService.forEndpoints(
    {
      block: (blockId) => crmOnboardingFormBlockEndpoint(formId, blockId),
      blockFields: (blockId) =>
        crmOnboardingFormBlockFieldsEndpoint(formId, blockId),
      field: (fieldId) => crmOnboardingFormFieldEndpoint(formId, fieldId),
      fieldMove: (fieldId) =>
        crmOnboardingFormFieldMoveEndpoint(formId, fieldId),
    },
    OWNER_CODES,
  );
}

export const onboardingFormApiService = {
  addBlock,
  definitionApi,
  getFieldUsage,
  getForm,
  moveBlock,
  removeBlock,
  start,
} as const;
