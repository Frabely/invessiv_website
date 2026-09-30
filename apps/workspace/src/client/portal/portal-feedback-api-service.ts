import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import {
  PORTAL_FEEDBACK_ERROR_CODE_VALUES,
  PortalFeedbackErrorCode,
} from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { FeedbackAttachmentDto } from "@invessiv/common/contracts/crm/feedback-attachment.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import type { SavePortalFeedbackDraftRequestDto } from "@invessiv/common/contracts/portal/save-portal-feedback-draft-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { PortalFeedbackAttachmentClientResult } from "@/common/contracts/portal/portal-feedback-attachment-client-result";
import type { PortalFeedbackClientFailure } from "@/common/contracts/portal/portal-feedback-client-failure";
import type { PortalFeedbackRoundClientResult } from "@/common/contracts/portal/portal-feedback-client-result";
import { readApiErrorCode } from "@/common/patterns/client/read-api-error-code";
import {
  portalFeedbackApproveEndpoint,
  portalFeedbackDraftEndpoint,
  portalFeedbackItemFileEndpoint,
  portalFeedbackItemFilesEndpoint,
  portalFeedbackSubmitEndpoint,
} from "@/common/patterns/portal/portal-api-endpoints";

const { isRecord, send } = versionedJsonMutationService;

type Response = NonNullable<Awaited<ReturnType<typeof send>>>;

function isRound(value: unknown): value is PortalFeedbackRoundDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    Array.isArray(value.items)
  );
}

function isAttachment(value: unknown): value is FeedbackAttachmentDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.displayName === "string"
  );
}

/** Portal feedback errors carry their code under `code`, not `error`. */
function readFailure(response: Response | null): PortalFeedbackClientFailure {
  const payload =
    response && isRecord(response.payload) ? response.payload : {};
  const code = readApiErrorCode(
    payload,
    PORTAL_FEEDBACK_ERROR_CODE_VALUES,
    PortalFeedbackErrorCode.Unavailable,
  );
  if (code === PortalFeedbackErrorCode.ItemTextRequired) {
    const itemIds = Array.isArray(payload.itemIds)
      ? payload.itemIds.filter((id): id is string => typeof id === "string")
      : [];
    return { ok: false as const, code, itemIds };
  }
  return { ok: false as const, code };
}

function toRoundResult(
  response: Response | null,
  readRound: (payload: unknown) => unknown,
): PortalFeedbackRoundClientResult {
  const round = response?.ok ? readRound(response.payload) : null;
  if (isRound(round)) return { ok: true, round };
  const current = response
    ? versionedJsonMutationService.readVersionConflict(response, isRound)
    : null;
  if (current)
    return { ok: false, code: ConcurrencyErrorCode.VersionConflict, current };
  return readFailure(response);
}

async function saveDraft(
  customerId: string,
  roundId: string,
  request: SavePortalFeedbackDraftRequestDto,
): Promise<PortalFeedbackRoundClientResult> {
  const response = await send(
    portalFeedbackDraftEndpoint(customerId, roundId),
    HttpMethod.Put,
    request,
  );
  return toRoundResult(response, (payload) => payload);
}

/** A repeated submit by the same contact succeeds as well; the page reloads either way. */
async function submit(
  customerId: string,
  roundId: string,
  version: number,
): Promise<PortalFeedbackRoundClientResult> {
  const response = await send(
    portalFeedbackSubmitEndpoint(customerId, roundId),
    HttpMethod.Post,
    { version },
  );
  return toRoundResult(response, (payload) =>
    isRecord(payload) ? payload.round : null,
  );
}

/** Only ever sent after the customer ticked the confirmation. */
async function approve(
  customerId: string,
  roundId: string,
  version: number,
): Promise<PortalFeedbackRoundClientResult> {
  const response = await send(
    portalFeedbackApproveEndpoint(customerId, roundId),
    HttpMethod.Post,
    { version, confirmFinal: true },
  );
  return toRoundResult(response, (payload) => payload);
}

function toAttachmentResult(
  response: Response | null,
): PortalFeedbackAttachmentClientResult {
  if (response?.ok && isAttachment(response.payload))
    return { ok: true, attachment: response.payload };
  return readFailure(response);
}

async function attachFile(
  customerId: string,
  target: { roundId: string; itemId: string },
  fileId: string,
): Promise<PortalFeedbackAttachmentClientResult> {
  return toAttachmentResult(
    await send(
      portalFeedbackItemFilesEndpoint(
        customerId,
        target.roundId,
        target.itemId,
      ),
      HttpMethod.Post,
      { fileId },
    ),
  );
}

/** Unhooks the file from the item; the file itself stays in the customer's files. */
async function detachFile(
  customerId: string,
  target: { roundId: string; itemId: string },
  fileId: string,
): Promise<PortalFeedbackAttachmentClientResult> {
  return toAttachmentResult(
    await send(
      portalFeedbackItemFileEndpoint(
        customerId,
        target.roundId,
        target.itemId,
        fileId,
      ),
      HttpMethod.Delete,
      undefined,
    ),
  );
}

export const portalFeedbackApiService = {
  saveDraft,
  submit,
  approve,
  attachFile,
  detachFile,
} as const;
