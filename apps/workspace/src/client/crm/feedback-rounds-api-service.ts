import {
  FEEDBACK_ROUND_ERROR_CODE_VALUES,
  FeedbackRoundErrorCode,
} from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { ChangeFeedbackRoundStatusRequestDto } from "@invessiv/common/contracts/crm/change-feedback-round-status-request.dto";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import type { FeedbackRoundDto } from "@invessiv/common/contracts/crm/feedback-round.dto";
import type { HandOverFeedbackRoundRequestDto } from "@invessiv/common/contracts/crm/hand-over-feedback-round-request.dto";
import type { MarkFeedbackRoundReadRequestDto } from "@invessiv/common/contracts/crm/mark-feedback-round-read-request.dto";
import type { SetFeedbackItemResultRequestDto } from "@invessiv/common/contracts/crm/set-feedback-item-result-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { VersionedJsonMutationResult } from "@/common/contracts/client/versioned-json-mutation-result";
import type { HandOverFeedbackRoundClientResult } from "@/common/contracts/crm/feedback-round-client-result";
import {
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

function setItemResult(
  itemId: string,
  request: SetFeedbackItemResultRequestDto,
): Promise<
  VersionedJsonMutationResult<FeedbackRoundItemDto, FeedbackRoundErrorCode>
> {
  return mutate(
    crmFeedbackItemResultEndpoint(itemId),
    HttpMethod.Patch,
    request,
    (payload) => (isItem(payload) ? payload : null),
    isItem,
    FEEDBACK_ROUND_ERROR_CODE_VALUES,
    FeedbackRoundErrorCode.Internal,
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
  markRead,
} as const;
