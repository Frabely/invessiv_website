import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import {
  FeedbackProcessingError,
  type FeedbackProcessingError as FeedbackProcessingErrorValue,
} from "@/common/constants/feedback/feedback-processing-errors";

/** Folds the server codes of the status and result commands into what the team can act on. */
export function feedbackProcessingError(
  code: FeedbackRoundErrorCode,
): FeedbackProcessingErrorValue {
  switch (code) {
    case FeedbackRoundErrorCode.RoundNotFound:
    case FeedbackRoundErrorCode.ItemNotFound:
      return FeedbackProcessingError.NotFound;
    case FeedbackRoundErrorCode.InvalidTransition:
      return FeedbackProcessingError.Changed;
    case FeedbackRoundErrorCode.RoundLocked:
      return FeedbackProcessingError.Locked;
    case FeedbackRoundErrorCode.ResultsIncomplete:
      return FeedbackProcessingError.ResultsIncomplete;
    case FeedbackRoundErrorCode.ValidationError:
      return FeedbackProcessingError.Validation;
    default:
      return FeedbackProcessingError.Internal;
  }
}
