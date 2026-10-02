import { describe, expect, it } from "vitest";

import { AccessFieldLimits } from "@/common/constants/access/access-field-limits";
import { BookingUrlIssue } from "@/common/constants/access/booking-url-issues";
import { parseBookingUrl } from "@/common/patterns/access/booking-url";

describe("parseBookingUrl", () => {
  it("clears the link for null, empty and blank input", () => {
    for (const input of [null, "", "   "]) {
      expect(parseBookingUrl(input)).toEqual({ ok: true, value: null });
    }
  });

  it("accepts an https link and stores its normalized form", () => {
    expect(parseBookingUrl("  HTTPS://Calendly.com/anna/onboarding  ")).toEqual(
      { ok: true, value: "https://calendly.com/anna/onboarding" },
    );
  });

  it("rejects every other scheme", () => {
    for (const input of [
      "http://calendly.com/anna",
      "javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "mailto:anna@example.test",
    ]) {
      expect(parseBookingUrl(input)).toEqual({
        ok: false,
        issue: BookingUrlIssue.NotHttps,
      });
    }
  });

  it("rejects text that is no absolute URL and links with credentials", () => {
    for (const input of [
      "calendly.com/anna",
      "https://",
      "https://anna:secret@calendly.com/anna",
    ]) {
      expect(parseBookingUrl(input)).toEqual({
        ok: false,
        issue: BookingUrlIssue.Invalid,
      });
    }
  });

  it("accepts a link at the limit and rejects one character more", () => {
    const base = "https://cal.com/";
    const atLimit =
      base + "a".repeat(AccessFieldLimits.BookingUrlMaxLength - base.length);
    expect(parseBookingUrl(atLimit)).toEqual({ ok: true, value: atLimit });
    expect(parseBookingUrl(`${atLimit}a`)).toEqual({
      ok: false,
      issue: BookingUrlIssue.TooLong,
    });
  });
});
