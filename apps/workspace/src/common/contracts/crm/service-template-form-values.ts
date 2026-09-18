import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import type { ServiceTemplateFormValidationCode } from "@/common/constants/crm/forms/service-template-form-validation-codes";

export type ServiceTemplateFormValues = {
  title: string;
  description: string;
  priceInput: string;
  pricingMode: ServicePricingMode;
  recurringInterval: BillingInterval | null;
  status: ServiceTemplateStatus;
};

export type ServiceTemplateFormErrors = Partial<
  Record<"title" | "priceInput", ServiceTemplateFormValidationCode>
>;
