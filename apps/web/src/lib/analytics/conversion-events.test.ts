import { describe, expect, it, vi } from "vitest";

import {
  ALLOWED_CONVERSION_EVENT_NAMES,
  ALLOWED_CONVERSION_PAYLOAD_FIELDS,
  CLICK_TRACKED_EVENT_NAMES,
  isClickTrackedEventName,
  isConversionEventName,
  sanitizeConversionEventPayload,
  trackConversionEvent,
} from "./conversion-events";

const trackMock = vi.fn();

vi.mock("@vercel/analytics/react", () => ({
  track: (...args: unknown[]) => trackMock(...args),
}));

describe("conversion events", () => {
  it("keeps the approved Analytics v1 event allowlist explicit", () => {
    expect(ALLOWED_CONVERSION_EVENT_NAMES).toEqual([
      "cta_click",
      "contact_click",
      "calendar_click",
      "lead_submit_success",
      "form_start",
      "form_submit_attempt",
      "form_submit_error",
      "language_switch",
      "theme_switch",
    ]);
    expect(isConversionEventName("calendar_click")).toBe(true);
    expect(isConversionEventName("unknown_event")).toBe(false);
  });

  it("keeps click-tracked Analytics events explicit", () => {
    expect(CLICK_TRACKED_EVENT_NAMES).toEqual([
      "cta_click",
      "contact_click",
      "calendar_click",
    ]);
    expect(isClickTrackedEventName("cta_click")).toBe(true);
    expect(isClickTrackedEventName("form_start")).toBe(false);
  });

  it("keeps the approved payload field allowlist explicit", () => {
    expect(ALLOWED_CONVERSION_PAYLOAD_FIELDS).toEqual([
      "location",
      "variant",
      "target",
      "form_id",
      "step",
      "error_type",
    ]);
  });

  it("drops disallowed, empty, and non-string payload fields before tracking", () => {
    const unsafePayload = {
      email: "max@example.com",
      error_type: "validation",
      form_id: "project_request",
      location: "contact",
      phone: "+49123456789",
      step: "",
      target: "form",
      variant: "primary",
    };

    expect(sanitizeConversionEventPayload(unsafePayload)).toEqual({
      error_type: "validation",
      form_id: "project_request",
      location: "contact",
      target: "form",
      variant: "primary",
    });

    trackConversionEvent("form_submit_error", unsafePayload);

    expect(trackMock).toHaveBeenCalledWith("form_submit_error", {
      error_type: "validation",
      form_id: "project_request",
      location: "contact",
      target: "form",
      variant: "primary",
    });
  });
});
