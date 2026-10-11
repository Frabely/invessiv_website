/** Constraint and index names of `line_item_templates`, declared once for the model and the duplicate mapping. */
export const LineItemTemplatesConstraintName = {
  TitleCheck: "line_item_templates_title_check",
  PriceCentsCheck: "line_item_templates_price_cents_check",
  PricingModeCheck: "line_item_templates_pricing_mode_check",
  RecurringIntervalCheck: "line_item_templates_recurring_interval_check",
  PricingModeIntervalConsistencyCheck:
    "line_item_templates_pricing_mode_interval_consistency_check",
  StatusCheck: "line_item_templates_status_check",
  VersionCheck: "line_item_templates_version_check",
  KindCheck: "line_item_templates_kind_check",
  ProjectModeCheck: "line_item_templates_project_mode_check",
  KindPricingModeCheck: "line_item_templates_kind_pricing_mode_check",
  KindProjectModeCheck: "line_item_templates_kind_project_mode_check",
  PortalDescriptionCheck: "line_item_templates_portal_description_check",
  StatusCreatedAtIndex: "line_item_templates_status_created_at_idx",
} as const;

export type LineItemTemplatesConstraintName =
  (typeof LineItemTemplatesConstraintName)[keyof typeof LineItemTemplatesConstraintName];

export const LINE_ITEM_TEMPLATES_CONSTRAINT_NAME_VALUES = [
  LineItemTemplatesConstraintName.TitleCheck,
  LineItemTemplatesConstraintName.PriceCentsCheck,
  LineItemTemplatesConstraintName.PricingModeCheck,
  LineItemTemplatesConstraintName.RecurringIntervalCheck,
  LineItemTemplatesConstraintName.PricingModeIntervalConsistencyCheck,
  LineItemTemplatesConstraintName.StatusCheck,
  LineItemTemplatesConstraintName.VersionCheck,
  LineItemTemplatesConstraintName.KindCheck,
  LineItemTemplatesConstraintName.ProjectModeCheck,
  LineItemTemplatesConstraintName.KindPricingModeCheck,
  LineItemTemplatesConstraintName.KindProjectModeCheck,
  LineItemTemplatesConstraintName.PortalDescriptionCheck,
  LineItemTemplatesConstraintName.StatusCreatedAtIndex,
] as const;
