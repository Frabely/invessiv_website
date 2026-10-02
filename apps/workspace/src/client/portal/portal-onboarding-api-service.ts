import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import {
  PORTAL_ONBOARDING_ERROR_CODE_VALUES,
  PortalOnboardingErrorCode,
} from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { QuestionnaireMissingField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-missing-field";
import type { AddPortalOnboardingGroupEntryRequestDto } from "@invessiv/common/contracts/portal/add-portal-onboarding-group-entry-request.dto";
import type { AttachPortalOnboardingFileRequestDto } from "@invessiv/common/contracts/portal/attach-portal-onboarding-file-request.dto";
import type { PortalOnboardingAnswerSavedDto } from "@invessiv/common/contracts/portal/portal-onboarding-answer-saved.dto";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { SavePortalOnboardingAnswerRequestDto } from "@invessiv/common/contracts/portal/save-portal-onboarding-answer-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import { readApiErrorCode } from "@/common/patterns/client/read-api-error-code";
import {
  portalOnboardingAnswersEndpoint,
  portalOnboardingFileEndpoint,
  portalOnboardingFilesEndpoint,
  portalOnboardingGroupEntriesEndpoint,
  portalOnboardingGroupEntryEndpoint,
  portalOnboardingGroupEntryMoveEndpoint,
  portalOnboardingServicesConfirmationEndpoint,
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

function isGroupEntries(value: unknown): value is QuestionnaireGroupEntryDto[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.id === "string" &&
        typeof entry.fieldId === "string" &&
        typeof entry.position === "number",
    )
  );
}

function isAnswerFile(value: unknown): value is QuestionnaireAnswerFileDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.fieldId === "string" &&
    isRecord(value.file) &&
    typeof value.file.id === "string"
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

/** The id comes from the caller, so sub-field answers can address the entry at once. */
async function addGroupEntry(
  customerId: string,
  formId: string,
  request: AddPortalOnboardingGroupEntryRequestDto,
): Promise<PortalOnboardingResult<QuestionnaireGroupEntryDto[]>> {
  return toResult(
    await send(
      portalOnboardingGroupEntriesEndpoint(customerId, formId),
      HttpMethod.Post,
      request,
    ),
    isGroupEntries,
  );
}

/** Removes the entry with its answers and file links; the files stay with the customer. */
async function removeGroupEntry(
  customerId: string,
  formId: string,
  entryId: string,
): Promise<PortalOnboardingResult<QuestionnaireGroupEntryDto[]>> {
  return toResult(
    await send(
      portalOnboardingGroupEntryEndpoint(customerId, formId, entryId),
      HttpMethod.Delete,
      undefined,
    ),
    isGroupEntries,
  );
}

async function moveGroupEntry(
  customerId: string,
  formId: string,
  entryId: string,
  direction: -1 | 1,
): Promise<PortalOnboardingResult<QuestionnaireGroupEntryDto[]>> {
  return toResult(
    await send(
      portalOnboardingGroupEntryMoveEndpoint(customerId, formId, entryId),
      HttpMethod.Post,
      { direction },
    ),
    isGroupEntries,
  );
}

/** Hangs an uploaded file onto a files field; the answer is the link, which detaching addresses. */
async function attachFile(
  customerId: string,
  formId: string,
  request: AttachPortalOnboardingFileRequestDto,
): Promise<PortalOnboardingResult<QuestionnaireAnswerFileDto>> {
  return toResult(
    await send(
      portalOnboardingFilesEndpoint(customerId, formId),
      HttpMethod.Post,
      request,
    ),
    isAnswerFile,
  );
}

async function detachFile(
  customerId: string,
  formId: string,
  answerFileId: string,
): Promise<PortalOnboardingResult<PortalOnboardingAnswerSavedDto>> {
  return toResult(
    await send(
      portalOnboardingFileEndpoint(customerId, formId, answerFileId),
      HttpMethod.Delete,
      undefined,
    ),
    isSaved,
  );
}

/** `note` null means the services fit as shown; a remark must carry text. */
async function confirmServices(
  customerId: string,
  formId: string,
  note: string | null,
): Promise<PortalOnboardingResult<PortalOnboardingAnswerSavedDto>> {
  return toResult(
    await send(
      portalOnboardingServicesConfirmationEndpoint(customerId, formId),
      HttpMethod.Post,
      { confirmed: true, note },
    ),
    isSaved,
  );
}

export const portalOnboardingApiService = {
  saveAnswer,
  submit,
  addGroupEntry,
  removeGroupEntry,
  moveGroupEntry,
  attachFile,
  detachFile,
  confirmServices,
} as const;
