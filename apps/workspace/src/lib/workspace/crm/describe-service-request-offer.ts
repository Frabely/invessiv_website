import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatDuration } from "@invessiv/common/patterns/time/format-duration";
import type { Locale } from "@/config/i18n";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { formatEuroCents } from "./format-service-price";

/**
 * The offer as one sentence: when it went out and, where recorded, for how much. The date makes
 * an offer nobody answered visible in the list. Offers marked before the content was stored have
 * no price and read as the date alone.
 */
export function describeServiceRequestOffer(
  request: ServiceRequestDto,
  content: CrmServiceRequestsDictionary,
  locale: Locale,
): string {
  if (request.offeredAt === null) return "";
  const date = formatMomentDay(request.offeredAt, locale);
  if (request.offeredPriceCents === null)
    return formatMessage(content.details.offeredPlain, { date });
  const amount = formatEuroCents(request.offeredPriceCents, locale);
  return request.offeredMinutes !== null
    ? formatMessage(content.details.offeredHours, {
        date,
        amount,
        duration: formatDuration(request.offeredMinutes),
      })
    : formatMessage(content.details.offered, { date, amount });
}
