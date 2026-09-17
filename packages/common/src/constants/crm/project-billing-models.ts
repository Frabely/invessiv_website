export const ProjectBillingModel = {
  FixedPrice: "fixed_price",
  Hourly: "hourly",
  Retainer: "retainer",
  Internal: "internal",
} as const;

export type ProjectBillingModel =
  (typeof ProjectBillingModel)[keyof typeof ProjectBillingModel];

export const PROJECT_BILLING_MODEL_VALUES = [
  ProjectBillingModel.FixedPrice,
  ProjectBillingModel.Hourly,
  ProjectBillingModel.Retainer,
  ProjectBillingModel.Internal,
] as const;
