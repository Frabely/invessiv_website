import {
  FEEDBACK_ROUND_ERROR_CODE_VALUES,
  FeedbackRoundErrorCode,
} from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { HandOverFeedbackRoundRequestDto } from "@invessiv/common/contracts/crm/hand-over-feedback-round-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { HandOverFeedbackRoundClientResult } from "@/common/contracts/crm/feedback-round-client-result";
import { crmProjectFeedbackRoundsEndpoint } from "@/common/patterns/crm/crm-api-endpoints";

const { isRecord, readErrorCode, send } = versionedJsonMutationService;

function readId(value: unknown): string | null {
  return isRecord(value) && typeof value.id === "string" ? value.id : null;
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

export const feedbackRoundsApiService = {
  handOver,
} as const;
