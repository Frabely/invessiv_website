import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { ONBOARDING_RELEASE_WARNING_KIND_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-release-warning-kinds";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { AddOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/add-onboarding-form-block-request.dto";
import type { ApplyOnboardingFormTemplateRequestDto } from "@invessiv/common/contracts/crm/onboarding/apply-onboarding-form-template-request.dto";
import type { CompleteOnboardingFormRequestDto } from "@invessiv/common/contracts/crm/onboarding/complete-onboarding-form-request.dto";
import type { MoveOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/move-onboarding-form-block-request.dto";
import type { OnboardingFieldUsageDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-field-usage.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingReleaseWarningDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-release-warning.dto";
import type { ReleaseOnboardingFormRequestDto } from "@invessiv/common/contracts/crm/onboarding/release-onboarding-form-request.dto";
import type { RemoveOnboardingFormBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/remove-onboarding-form-block-request.dto";
import type { RequestOnboardingChangesRequestDto } from "@invessiv/common/contracts/crm/onboarding/request-onboarding-changes-request.dto";
import type { ReviewOnboardingBlockRequestDto } from "@invessiv/common/contracts/crm/onboarding/review-onboarding-block-request.dto";
import type { StartProjectOnboardingRequestDto } from "@invessiv/common/contracts/crm/onboarding/start-project-onboarding-request.dto";
import { questionnaireDefinitionApiService } from "@/client/crm/questionnaire-definition-api-service";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";
import type { OnboardingFormClientResult } from "@/common/contracts/crm/onboarding/onboarding-form-client-result";
import type { OnboardingReleaseClientResult } from "@/common/contracts/crm/onboarding/onboarding-release-client-result";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import type { QuestionnaireOwnerErrorCodes } from "@/common/contracts/crm/questionnaire/questionnaire-owner-error-codes";
import {
  crmOnboardingFormBlockEndpoint,
  crmOnboardingFormBlockFieldsEndpoint,
  crmOnboardingFormBlockMoveEndpoint,
  crmOnboardingFormBlockReviewEndpoint,
  crmOnboardingFormBlocksEndpoint,
  crmOnboardingFormCompleteEndpoint,
  crmOnboardingFormEndpoint,
  crmOnboardingFormFieldEndpoint,
  crmOnboardingFormFieldMoveEndpoint,
  crmOnboardingFormFieldUsageEndpoint,
  crmOnboardingFormReleaseEndpoint,
  crmOnboardingFormRequestChangesEndpoint,
  crmOnboardingFormTemplateEndpoint,
  crmProjectOnboardingEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord, readErrorCode, readVersionConflict, send } =
  versionedJsonMutationService;

const WARNING_KINDS: readonly string[] = ONBOARDING_RELEASE_WARNING_KIND_VALUES;

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

/** A warning of a kind this client does not know yet is left out instead of shown half. */
function isReleaseWarning(
  value: unknown,
): value is OnboardingReleaseWarningDto {
  return (
    isRecord(value) &&
    typeof value.kind === "string" &&
    WARNING_KINDS.includes(value.kind)
  );
}

function isUsage(value: unknown): value is OnboardingFieldUsageDto {
  return (
    isRecord(value) &&
    typeof value.answers === "number" &&
    typeof value.files === "number" &&
    typeof value.entries === "number"
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

function applyTemplate(
  formId: string,
  request: ApplyOnboardingFormTemplateRequestDto,
) {
  return mutateForm(
    crmOnboardingFormTemplateEndpoint(formId),
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

/**
 * Releases a draft to the portal. Without `acknowledgeWarnings` a form with warnings comes back
 * with their list instead of being released; the same request with the flag set goes through.
 */
async function release(
  formId: string,
  request: ReleaseOnboardingFormRequestDto,
): Promise<OnboardingReleaseClientResult> {
  const response = await send(
    crmOnboardingFormReleaseEndpoint(formId),
    HttpMethod.Post,
    request,
  );
  if (!response) return { ok: false, code: OnboardingErrorCode.Internal };
  if (response.ok && isForm(response.payload))
    return { ok: true, value: response.payload };

  const current = readVersionConflict(response, isForm);
  if (current)
    return { ok: false, code: ConcurrencyErrorCode.VersionConflict, current };

  const code = readErrorCode(
    response.payload,
    ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES,
    OnboardingErrorCode.Internal,
  );
  if (code !== OnboardingErrorCode.ReleaseWarnings) return { ok: false, code };
  const details = isRecord(response.payload) ? response.payload.details : null;
  const warnings =
    isRecord(details) && Array.isArray(details.warnings)
      ? details.warnings.filter(isReleaseWarning)
      : [];
  return { ok: false, code, warnings };
}

/** Sets the review of one block; a stale review version comes back with the current form. */
function reviewBlock(
  formId: string,
  blockId: string,
  request: ReviewOnboardingBlockRequestDto,
) {
  return mutateForm(
    crmOnboardingFormBlockReviewEndpoint(formId, blockId),
    HttpMethod.Patch,
    request,
  );
}

/** Hands the blocks with a question for the customer back to the portal. */
function requestChanges(
  formId: string,
  request: RequestOnboardingChangesRequestDto,
) {
  return mutateForm(
    crmOnboardingFormRequestChangesEndpoint(formId),
    HttpMethod.Post,
    request,
  );
}

/**
 * Completes a submitted form. Missing required answers and a missing or future call date come
 * back as plain codes; the dialog reads what is missing from the form it already shows.
 */
function complete(formId: string, request: CompleteOnboardingFormRequestDto) {
  return mutateForm(
    crmOnboardingFormCompleteEndpoint(formId),
    HttpMethod.Post,
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
  applyTemplate,
  complete,
  definitionApi,
  getFieldUsage,
  getForm,
  moveBlock,
  release,
  removeBlock,
  requestChanges,
  reviewBlock,
  start,
} as const;
