import { describe, expect, it } from "vitest";
import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { feedbackProcessingError } from "./feedback-processing-error";

describe("feedbackProcessingError", () => {
  it.each([
    [FeedbackRoundErrorCode.RoundNotFound, "notFound"],
    [FeedbackRoundErrorCode.ItemNotFound, "notFound"],
    [FeedbackRoundErrorCode.InvalidTransition, "changed"],
    [FeedbackRoundErrorCode.RoundLocked, "locked"],
    [FeedbackRoundErrorCode.ResultsIncomplete, "resultsIncomplete"],
    [FeedbackRoundErrorCode.ValidationError, "validation"],
    [FeedbackRoundErrorCode.Internal, "internal"],
    [FeedbackRoundErrorCode.QuotaExhausted, "internal"],
  ])("maps %s to %s", (code, key) => {
    expect(feedbackProcessingError(code)).toBe(key);
  });
});
