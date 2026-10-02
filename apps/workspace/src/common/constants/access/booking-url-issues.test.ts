import { describe, expect, it } from "vitest";

import {
  BOOKING_URL_ISSUE_VALUES,
  BookingUrlIssue,
} from "@/common/constants/access/booking-url-issues";

describe("BookingUrlIssue", () => {
  it("contains the exact values without duplicates", () => {
    expect(BOOKING_URL_ISSUE_VALUES).toEqual([
      "invalid",
      "not_https",
      "too_long",
    ]);
    expect([...BOOKING_URL_ISSUE_VALUES]).toEqual(
      Object.values(BookingUrlIssue),
    );
    expect(new Set(BOOKING_URL_ISSUE_VALUES).size).toBe(
      BOOKING_URL_ISSUE_VALUES.length,
    );
  });
});
