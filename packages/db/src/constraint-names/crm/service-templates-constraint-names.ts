/** Constraint and index names of `service_templates`, declared once for the model and the duplicate mapping. */
export const ServiceTemplatesConstraintName = {
  TitleCheck: "service_templates_title_check",
  PriceCentsCheck: "service_templates_price_cents_check",
  PricingModeCheck: "service_templates_pricing_mode_check",
  RecurringIntervalCheck: "service_templates_recurring_interval_check",
  PricingModeIntervalConsistencyCheck:
    "service_templates_pricing_mode_interval_consistency_check",
  StatusCheck: "service_templates_status_check",
  VersionCheck: "service_templates_version_check",
  StatusCreatedAtIndex: "service_templates_status_created_at_idx",
} as const;

export type ServiceTemplatesConstraintName =
  (typeof ServiceTemplatesConstraintName)[keyof typeof ServiceTemplatesConstraintName];

export const SERVICE_TEMPLATES_CONSTRAINT_NAME_VALUES = [
  ServiceTemplatesConstraintName.TitleCheck,
  ServiceTemplatesConstraintName.PriceCentsCheck,
  ServiceTemplatesConstraintName.PricingModeCheck,
  ServiceTemplatesConstraintName.RecurringIntervalCheck,
  ServiceTemplatesConstraintName.PricingModeIntervalConsistencyCheck,
  ServiceTemplatesConstraintName.StatusCheck,
  ServiceTemplatesConstraintName.VersionCheck,
  ServiceTemplatesConstraintName.StatusCreatedAtIndex,
] as const;
