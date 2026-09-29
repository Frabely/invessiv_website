import "server-only";

import { FeedbackRoundErrorCode as E } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";
import type { CrmOperation } from "@/common/constants/crm/crm-operations";
import { markPrivateNoStore } from "@/lib/http/private-no-store";
import { logCrmFailure } from "@/lib/workspace/crm/log-crm-failure";

const STATUS: Record<E, H> = {
  [E.RoundNotFound]: H.NotFound,
  [E.ItemNotFound]: H.NotFound,
  [E.ProjectNotFound]: H.NotFound,
  [E.ValidationError]: H.BadRequest,
  [E.ProjectNotEligible]: H.Conflict,
  [E.RoundStepMissing]: H.Conflict,
  [E.ProjectNotAtFeedbackStep]: H.Conflict,
  [E.RoundAlreadyActive]: H.Conflict,
  [E.QuotaExhausted]: H.Conflict,
  [E.ProjectAlreadyApproved]: H.Conflict,
  [E.InvalidTransition]: H.Conflict,
  [E.RoundLocked]: H.Conflict,
  [E.NotLatestRound]: H.Conflict,
  [E.ItemsRequired]: H.UnprocessableContent,
  [E.ItemTextRequired]: H.UnprocessableContent,
  [E.ItemsPresent]: H.UnprocessableContent,
  [E.ResultsIncomplete]: H.UnprocessableContent,
  [E.ConfirmationRequired]: H.UnprocessableContent,
  [E.AttachmentLimitReached]: H.UnprocessableContent,
  [E.FileNotAttachable]: H.UnprocessableContent,
  [E.Internal]: H.InternalServerError,
};

const MESSAGES: Record<E, string> = {
  [E.RoundNotFound]: "Feedback round not found",
  [E.ItemNotFound]: "Feedback item not found",
  [E.ProjectNotFound]: "Project not found",
  [E.ValidationError]: "Validation failed",
  [E.ProjectNotEligible]: "Only active projects can receive a feedback round",
  [E.RoundStepMissing]: "The project track has no step for this round",
  [E.ProjectNotAtFeedbackStep]:
    "The project is not at the step before this round",
  [E.RoundAlreadyActive]: "A feedback round is already running",
  [E.QuotaExhausted]: "All included feedback rounds are used",
  [E.ProjectAlreadyApproved]: "The project is already approved",
  [E.InvalidTransition]: "This status change is not allowed",
  [E.RoundLocked]: "The feedback round can no longer be changed",
  [E.NotLatestRound]: "Only the latest round can be approved",
  [E.ItemsRequired]: "At least one feedback item is required",
  [E.ItemTextRequired]: "Every feedback item needs a text",
  [E.ItemsPresent]: "A round with feedback items cannot be approved as is",
  [E.ResultsIncomplete]: "Every feedback item needs a result",
  [E.ConfirmationRequired]: "The approval has to be confirmed",
  [E.AttachmentLimitReached]: "Attachment limit reached",
  [E.FileNotAttachable]: "This file cannot be attached",
  [E.Internal]: "Unexpected server error",
};

export function feedbackRoundApiError(
  code: E,
  details: Record<string, unknown> = {},
): Response {
  return Response.json(
    { error: code, message: MESSAGES[code], ...details },
    { status: STATUS[code] },
  );
}

/**
 * Every feedback answer carries customer text, so denied, failed and successful answers alike stay
 * out of caches. Unexpected failures are logged by operation only.
 */
export async function privateFeedbackRoundResponse(
  operation: CrmOperation,
  run: () => Promise<Response>,
): Promise<Response> {
  let response: Response;
  try {
    response = await run();
  } catch (error: unknown) {
    logCrmFailure(operation, error);
    response = feedbackRoundApiError(E.Internal);
  }
  return markPrivateNoStore(response);
}
