import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { getCrmProjectLineItemsDictionary } from "@/i18n/dictionaries/workspace/crm";
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
  const pricing = getCrmProjectLineItemsDictionary(locale);
  if (request.offeredMinutes === null && request.offeredPricingMode !== null) {
    if (
      request.offeredPricingMode === ServicePricingMode.Recurring &&
      request.offeredRecurringInterval !== null
    )
      return formatMessage(content.details.offeredRecurring, {
        date,
        amount,
        interval: pricing.form.interval[request.offeredRecurringInterval],
      });
    return formatMessage(content.details.offeredPriced, {
      date,
      amount,
      mode: pricing.list.pricingMode[request.offeredPricingMode],
    });
  }
  return request.offeredMinutes !== null
    ? formatMessage(content.details.offeredHours, {
        date,
        amount,
        duration: formatDuration(request.offeredMinutes),
      })
    : formatMessage(content.details.offered, { date, amount });
}
