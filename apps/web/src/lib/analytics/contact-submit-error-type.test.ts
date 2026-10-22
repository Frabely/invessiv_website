import { describe, expect, it } from "vitest";

import type { ContactSubmitErrorResponse } from "@invessiv/common/contracts/contact/submit/contact-submit";
import { CONTACT_SUBMIT_ERROR_CODE } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";
import { AnalyticsFormFailureReason } from "@/common/constants/analytics/analytics-form";
import { getContactSubmitFailureReason } from "./contact-submit-error-type";

function createErrorResponse(
  code: ContactSubmitErrorResponse["code"],
): ContactSubmitErrorResponse {
  return {
    code,
    ok: false,
    requestId: "req_test",
  };
}

describe("getContactSubmitFailureReason", () => {
  it("maps contact submit errors to the controlled analytics failure reasons", () => {
    expect(
      getContactSubmitFailureReason(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.RateLimited),
      ),
    ).toBe(AnalyticsFormFailureReason.RateLimited);
    expect(
      getContactSubmitFailureReason(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.DeliveryUnavailable),
      ),
    ).toBe(AnalyticsFormFailureReason.Delivery);
    expect(
      getContactSubmitFailureReason(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.ValidationError),
      ),
    ).toBe(AnalyticsFormFailureReason.Validation);
    expect(
      getContactSubmitFailureReason(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.SpamDetected),
      ),
    ).toBe(AnalyticsFormFailureReason.Validation);
    expect(
      getContactSubmitFailureReason(
        createErrorResponse(CONTACT_SUBMIT_ERROR_CODE.InternalError),
      ),
    ).toBe(AnalyticsFormFailureReason.Generic);
  });
});
