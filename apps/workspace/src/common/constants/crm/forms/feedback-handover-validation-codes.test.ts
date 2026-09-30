import { describe, expect, it } from "vitest";

import {
  FEEDBACK_HANDOVER_VALIDATION_CODE_VALUES,
  FeedbackHandoverValidationCode,
} from "./feedback-handover-validation-codes";

describe("FeedbackHandoverValidationCode", () => {
  it("contains the exact codes without duplicates", () => {
    expect(FEEDBACK_HANDOVER_VALIDATION_CODE_VALUES).toEqual([
      "PREVIEW_URL_INVALID",
      "DUE_ON_PAST",
    ]);
    expect([...FEEDBACK_HANDOVER_VALIDATION_CODE_VALUES]).toEqual(
      Object.values(FeedbackHandoverValidationCode),
    );
  });
});
