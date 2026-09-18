export const ServicePricingMode = {
  OneTime: "one_time",
  Recurring: "recurring",
  Rate: "rate",
} as const;

export type ServicePricingMode =
  (typeof ServicePricingMode)[keyof typeof ServicePricingMode];

export const SERVICE_PRICING_MODE_VALUES = [
  ServicePricingMode.OneTime,
  ServicePricingMode.Recurring,
  ServicePricingMode.Rate,
] as const;
