import { MINUTES_PER_HOUR } from "@invessiv/common/constants/time/time-units";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { ProjectLineItemValue } from "@invessiv/common/contracts/crm/project-line-item-value";

/** What purchased hours cost at an hourly rate, rounded to whole cents. */
export function hoursLineItemAmountCents(
  rateCents: number,
  quantityMinutes: number,
): number {
  return Math.round((rateCents * quantityMinutes) / MINUTES_PER_HOUR);
}

export function calculateProjectLineItemValue(
  items: readonly ProjectLineItemDto[],
): ProjectLineItemValue {
  return items.reduce<ProjectLineItemValue>(
    (value, item) => {
      if (item.status !== ProjectLineItemStatus.Confirmed) return value;
      if (item.pricingMode === ServicePricingMode.OneTime) {
        value.oneTimeCents += item.priceCents;
      }
      if (
        item.pricingMode === ServicePricingMode.Recurring &&
        item.recurringInterval === BillingInterval.Monthly
      ) {
        value.monthlyCents += item.priceCents;
      }
      // A bare rate is a condition; purchased hours are revenue of rate times hours.
      if (
        item.pricingMode === ServicePricingMode.Rate &&
        item.quantityMinutes !== null
      ) {
        value.oneTimeCents += hoursLineItemAmountCents(
          item.priceCents,
          item.quantityMinutes,
        );
      }
      return value;
    },
    { oneTimeCents: 0, monthlyCents: 0 },
  );
}
