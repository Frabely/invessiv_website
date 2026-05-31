import { describe, expect, it } from "vitest";

import type { ContactSubmitErrorResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import { ContactFormSubmitErrorType } from "@/lib/analytics/contact-form-submit-error-type";
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
      getContactSubmitAnalyticsErrorType(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.RateLimited),
      ),
    ).toBe(ContactFormSubmitErrorType.RateLimited);
    expect(
      getContactSubmitAnalyticsErrorType(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable),
      ),
    ).toBe(ContactFormSubmitErrorType.Delivery);
    expect(
      getContactSubmitAnalyticsErrorType(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.ValidationError),
      ),
    ).toBe(ContactFormSubmitErrorType.Validation);
    expect(
      getContactSubmitAnalyticsErrorType(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.SpamDetected),
      ),
    ).toBe(ContactFormSubmitErrorType.Validation);
    expect(
      getContactSubmitAnalyticsErrorType(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.InternalError),
      ),
    ).toBe(ContactFormSubmitErrorType.Generic);
  });
});
