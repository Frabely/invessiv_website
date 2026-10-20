import {
  FEEDBACK_ROUND_ERROR_CODE_VALUES,
  FeedbackRoundErrorCode,
} from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { AskFeedbackItemClarificationRequestDto } from "@invessiv/common/contracts/crm/ask-feedback-item-clarification-request.dto";
import type { CloseFeedbackItemClarificationRequestDto } from "@invessiv/common/contracts/crm/close-feedback-item-clarification-request.dto";
import type { ChangeFeedbackRoundStatusRequestDto } from "@invessiv/common/contracts/crm/change-feedback-round-status-request.dto";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import type { HandOverFeedbackRoundRequestDto } from "@invessiv/common/contracts/crm/hand-over-feedback-round-request.dto";
import type { MarkFeedbackRoundReadRequestDto } from "@invessiv/common/contracts/crm/mark-feedback-round-read-request.dto";
import type { SetFeedbackItemResultRequestDto } from "@invessiv/common/contracts/crm/set-feedback-item-result-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";
import type { HandOverFeedbackRoundClientResult } from "@/common/contracts/crm/feedback-round-client-result";
import type { FeedbackItemClientResult } from "@/common/contracts/crm/feedback-item-client-result";
import {
  crmFeedbackItemClarificationCloseEndpoint,
  crmFeedbackItemClarificationsEndpoint,
  crmFeedbackItemResultEndpoint,
  crmFeedbackRoundReadEndpoint,
  crmFeedbackRoundStatusEndpoint,
  crmProjectFeedbackRoundsEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord, mutate, readErrorCode, send } = versionedJsonMutationService;

function readId(value: unknown): string | null {
  return isRecord(value) && typeof value.id === "string" ? value.id : null;
}

function isRound(value: unknown): value is FeedbackRoundDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.status === "string" &&
    typeof value.version === "number" &&
    Array.isArray(value.items)
  );
}

function isItem(value: unknown): value is FeedbackRoundItemDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    "result" in value
  );
}

/** A 409 carries the current round, so the caller can show what changed instead of guessing. */
function changeStatus(
  roundId: string,
  request: ChangeFeedbackRoundStatusRequestDto,
): Promise<
  VersionedJsonMutationResult<FeedbackRoundDto, FeedbackRoundErrorCode>
> {
  return mutate(
    crmFeedbackRoundStatusEndpoint(roundId),
    HttpMethod.Post,
    request,
    (payload) => (isRound(payload) ? payload : null),
    isRound,
    FEEDBACK_ROUND_ERROR_CODE_VALUES,
    FeedbackRoundErrorCode.Internal,
  );
}

/** Result, question and closure all answer with the whole item, a 409 with the current one. */
async function mutateItem(
  url: string,
  method: HttpMethod,
  request: unknown,
): Promise<FeedbackItemClientResult> {
  const response = await send(url, method, request);
  if (!response) return { ok: false, code: FeedbackRoundErrorCode.Internal };
  if (response.ok && isItem(response.payload))
    return { ok: true, value: response.payload };
  const conflict = versionedJsonMutationService.readVersionConflict(
    response,
    isItem,
  );
  if (conflict)
    return {
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: conflict,
    };
  const code = readErrorCode(
    response.payload,
    FEEDBACK_ROUND_ERROR_CODE_VALUES,
    FeedbackRoundErrorCode.Internal,
  );
  if (
    response.status === HttpResponseCode.Conflict &&
    (code === FeedbackRoundErrorCode.ClarificationOpen ||
      code === FeedbackRoundErrorCode.ClarificationNotOpen) &&
    isRecord(response.payload) &&
    isItem(response.payload.current)
  )
    return { ok: false, code, current: response.payload.current };
  return { ok: false, code };
}

function setItemResult(
  itemId: string,
  request: SetFeedbackItemResultRequestDto,
): Promise<FeedbackItemClientResult> {
  return mutateItem(
    crmFeedbackItemResultEndpoint(itemId),
    HttpMethod.Patch,
    request,
  );
}

function askClarification(
  itemId: string,
  request: AskFeedbackItemClarificationRequestDto,
): Promise<FeedbackItemClientResult> {
  return mutateItem(
    crmFeedbackItemClarificationsEndpoint(itemId),
    HttpMethod.Post,
    request,
  );
}

function closeClarification(
  itemId: string,
  clarificationId: string,
  request: CloseFeedbackItemClarificationRequestDto,
): Promise<FeedbackItemClientResult> {
  return mutateItem(
    crmFeedbackItemClarificationCloseEndpoint(itemId, clarificationId),
    HttpMethod.Post,
    request,
  );
}

async function handOver(
  projectId: string,
  request: HandOverFeedbackRoundRequestDto,
): Promise<HandOverFeedbackRoundClientResult> {
  const response = await send(
    crmProjectFeedbackRoundsEndpoint(projectId),
    HttpMethod.Post,
    request,
  );
  if (!response) return { ok: false, code: FeedbackRoundErrorCode.Internal };
  const roundId = response.ok ? readId(response.payload) : null;
  if (roundId) return { ok: true, roundId };
  const code = readErrorCode(
    response.payload,
    FEEDBACK_ROUND_ERROR_CODE_VALUES,
    FeedbackRoundErrorCode.Internal,
  );
  const activeRoundId =
    code === FeedbackRoundErrorCode.RoundAlreadyActive &&
    isRecord(response.payload)
      ? readId(response.payload.activeRound)
      : null;
  return activeRoundId
    ? {
        ok: false,
        code: FeedbackRoundErrorCode.RoundAlreadyActive,
        activeRoundId,
      }
    : { ok: false, code };
}

/** True only when this call stamped the round; a failure or an earlier stamp both answer false. */
async function markRead(
  roundId: string,
  request: MarkFeedbackRoundReadRequestDto,
): Promise<boolean> {
  const response = await send(
    crmFeedbackRoundReadEndpoint(roundId),
    HttpMethod.Post,
    request,
  );
  return (
    response?.ok === true &&
    isRecord(response.payload) &&
    response.payload.marked === true
  );
}

export const feedbackRoundsApiService = {
  handOver,
  changeStatus,
  setItemResult,
  askClarification,
  closeClarification,
  markRead,
} as const;
