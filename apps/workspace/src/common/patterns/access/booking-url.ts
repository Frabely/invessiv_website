import { AccessFieldLimits } from "@/common/constants/access/access-field-limits";
import { BookingUrlIssue } from "@/common/constants/access/booking-url-issues";
import type { BookingUrlParseResult } from "@/common/contracts/access/booking-url-parse-result";
import { BookingUrlLimits } from "@invessiv/common/constants/auth/booking-url-limits";

/**
 * The one definition of an acceptable booking link, for the server schema and both dialogs.
 * Blank input clears the link. Everything else must be an absolute `https` URL without embedded
 * credentials; the stored value is the normalized form, so its scheme is lower case and the
 * CHECK on the column sees exactly what was validated here.
 */
export function parseBookingUrl(input: string | null): BookingUrlParseResult {
  const trimmed = input?.trim() ?? "";
  if (trimmed === "") {
    return { ok: true, value: null };
  }
  if (!URL.canParse(trimmed)) {
    return { ok: false, issue: BookingUrlIssue.Invalid };
  }
  const url = new URL(trimmed);
  if (url.protocol !== BookingUrlLimits.Protocol) {
    return { ok: false, issue: BookingUrlIssue.NotHttps };
  }
  // A link with credentials would hand them to every customer who sees the card.
  if (url.hostname === "" || url.username !== "" || url.password !== "") {
    return { ok: false, issue: BookingUrlIssue.Invalid };
  }
  if (url.href.length > AccessFieldLimits.BookingUrlMaxLength) {
    return { ok: false, issue: BookingUrlIssue.TooLong };
  }
  return { ok: true, value: url.href };
}
