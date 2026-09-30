import { describe, expect, it } from "vitest";
import {
  FEEDBACK_PROCESSING_ERROR_VALUES,
  FeedbackProcessingError,
} from "./feedback-processing-errors";

describe("FeedbackProcessingError", () => {
  it("lists every message key exactly once", () => {
    expect([...FEEDBACK_PROCESSING_ERROR_VALUES]).toEqual(
      Object.values(FeedbackProcessingError),
    );
    expect(new Set(FEEDBACK_PROCESSING_ERROR_VALUES).size).toBe(
      FEEDBACK_PROCESSING_ERROR_VALUES.length,
    );
  });
});
