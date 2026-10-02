import type { BookingUrlIssue } from "@/common/constants/access/booking-url-issues";

/** `value` is the link as it is stored: normalized, or null when the input clears it. */
export type BookingUrlParseResult =
  { ok: true; value: string | null } | { ok: false; issue: BookingUrlIssue };
