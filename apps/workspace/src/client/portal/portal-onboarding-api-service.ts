import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import {
  PORTAL_ONBOARDING_ERROR_CODE_VALUES,
  PortalOnboardingErrorCode,
} from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireMissingField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-missing-field";
import type { PortalOnboardingAnswerSavedDto } from "@invessiv/common/contracts/portal/portal-onboarding-answer-saved.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { SavePortalOnboardingAnswerRequestDto } from "@invessiv/common/contracts/portal/save-portal-onboarding-answer-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { readApiErrorCode } from "@/common/patterns/client/read-api-error-code";
import {
  portalOnboardingAnswersEndpoint,
  portalOnboardingSubmitEndpoint,
} from "@/common/patterns/portal/portal-api-endpoints";

const { isRecord, send } = versionedJsonMutationService;

type Response = Awaited<ReturnType<typeof send>>;

function isSaved(value: unknown): value is PortalOnboardingAnswerSavedDto {
  return isRecord(value) && typeof value.savedAt === "string";
}

function isSummary(value: unknown): value is PortalOnboardingFormSummaryDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.status === "string"
  );
}

function isMissingField(value: unknown): value is QuestionnaireMissingField {
  return (
    isRecord(value) &&
    typeof value.blockId === "string" &&
    typeof value.fieldId === "string" &&
    (value.groupEntryId === null || typeof value.groupEntryId === "string")
  );
}

/** A network failure and an answer of unexpected shape both read as `unavailable`. */
function toResult<T>(
  response: Response,
  isValue: (payload: unknown) => payload is T,
): PortalOnboardingResult<T> {
  if (response?.ok && isValue(response.payload))
    return { ok: true, value: response.payload };
  const payload =
    response && !response.ok && isRecord(response.payload)
      ? response.payload
      : {};
  const code = readApiErrorCode(
    payload,
    PORTAL_ONBOARDING_ERROR_CODE_VALUES,
    PortalOnboardingErrorCode.Unavailable,
  );
  if (code !== PortalOnboardingErrorCode.RequiredMissing)
    return { ok: false, code };
  return {
    ok: false,
    code,
    missing: Array.isArray(payload.missing)
      ? payload.missing.filter(isMissingField)
      : [],
  };
}

/** Replaces one slot; an empty list in the request clears it. */
async function saveAnswer(
  customerId: string,
  formId: string,
  request: SavePortalOnboardingAnswerRequestDto,
): Promise<PortalOnboardingResult<PortalOnboardingAnswerSavedDto>> {
  return toResult(
    await send(
      portalOnboardingAnswersEndpoint(customerId, formId),
      HttpMethod.Put,
      request,
    ),
    isSaved,
  );
}

/** Submits what the server holds; the caller saves everything typed first. */
async function submit(
  customerId: string,
  formId: string,
): Promise<PortalOnboardingResult<PortalOnboardingFormSummaryDto>> {
  return toResult(
    await send(
      portalOnboardingSubmitEndpoint(customerId, formId),
      HttpMethod.Post,
      undefined,
    ),
    isSummary,
  );
}

export const portalOnboardingApiService = { saveAnswer, submit } as const;
