import { describe, expect, it } from "vitest";

import type { ContactSubmitErrorResponse } from "@/common/contracts/contact/submit/contact-submit";
import { getContactSubmitAnalyticsErrorType } from "./contact-submit-error-type";

function createErrorResponse(
  code: ContactSubmitErrorResponse["code"],
): ContactSubmitErrorResponse {
  return {
    code,
    ok: false,
    requestId: "req_test",
  };
}

describe("getContactSubmitAnalyticsErrorType", () => {
  it("maps contact submit errors to the controlled analytics error types", () => {
    expect(
      getContactSubmitAnalyticsErrorType(createErrorResponse("rate_limited")),
    ).toBe("rate_limited");
    expect(
      getContactSubmitAnalyticsErrorType(
        createErrorResponse("delivery_unavailable"),
      ),
    ).toBe("delivery");
    expect(
      getContactSubmitAnalyticsErrorType(
        createErrorResponse("validation_error"),
      ),
    ).toBe("validation");
    expect(
      getContactSubmitAnalyticsErrorType(createErrorResponse("spam_detected")),
    ).toBe("validation");
    expect(
      getContactSubmitAnalyticsErrorType(createErrorResponse("internal_error")),
    ).toBe("generic");
  });
});
