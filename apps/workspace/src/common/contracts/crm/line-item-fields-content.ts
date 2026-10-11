import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { LineItemFieldsFormValidationCode } from "@/common/constants/crm/forms/line-item-fields-form-validation-codes";
import type { LineItemFieldsLabels } from "@/common/contracts/crm/line-item-fields-labels";
import type { LineItemFieldsPlaceholders } from "@/common/contracts/crm/line-item-fields-placeholders";

/** Labels required by the shared snapshot controls. */
export type LineItemFieldsContent = {
  fields: LineItemFieldsLabels;
  placeholders: LineItemFieldsPlaceholders;
  currencySymbol: string;
  validation: Record<LineItemFieldsFormValidationCode, string>;
  pricingMode: Record<ServicePricingMode, string>;
  interval: Record<BillingInterval, string>;
};
