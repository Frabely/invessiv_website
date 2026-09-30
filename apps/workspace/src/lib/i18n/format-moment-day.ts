import { BUSINESS_TIME_ZONE } from "@invessiv/common/constants/crm/business-time-zone";
import type { Locale } from "@/config/i18n";

/** A moment (handover, submission) shown as the calendar day it happened on in the business time zone. */
export function formatMomentDay(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date(iso));
}
