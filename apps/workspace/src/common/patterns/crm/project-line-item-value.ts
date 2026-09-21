import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { ProjectLineItemValue } from "@/common/contracts/crm/project-line-item-value";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";

export function calculateProjectLineItemValue(
  items: readonly ProjectLineItemDto[],
): ProjectLineItemValue {
  return items.reduce<ProjectLineItemValue>(
    (value, item) => {
      if (item.status !== ProjectLineItemStatus.Confirmed) return value;
      if (item.pricingMode === ServicePricingMode.OneTime) {
        value.oneTimeCents += item.priceCents;
      }
      if (item.pricingMode === ServicePricingMode.Recurring) {
        if (item.recurringInterval === BillingInterval.Monthly) {
          value.monthlyCents += item.priceCents;
        }
      }
      return value;
    },
    { oneTimeCents: 0, monthlyCents: 0 },
  );
}
