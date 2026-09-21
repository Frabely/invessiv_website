import type { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import type { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { LineItemFieldsFormValidationCode } from "@/common/constants/crm/forms/line-item-fields-form-validation-codes";

/** The five fields that describe a service, whether it lives in the catalog or on a project. */
export type LineItemFieldsFormValues = {
  title: string;
  description: string;
  /** Raw euro input as typed; parsed to cents only on submit. */
  priceInput: string;
  pricingMode: ServicePricingMode;
  recurringInterval: BillingInterval | null;
};

export type LineItemFieldsFormErrors = Partial<
  Record<
    "title" | "priceInput" | "recurringInterval",
    LineItemFieldsFormValidationCode
  >
>;

/** Anything that can pre-fill the form: a catalog template or an already assigned project line item. */
export type LineItemFieldsSource = {
  title: string;
  description: string;
  priceCents: number;
  pricingMode: ServicePricingMode;
  recurringInterval: BillingInterval | null;
};

/** The snapshot part of a create or update request; the caller adds its own fields around it. */
export type LineItemFieldsRequestFields = {
  title: string;
  description: string;
  priceCents: number;
  pricingMode: ServicePricingMode;
  recurringInterval: BillingInterval | null;
};
