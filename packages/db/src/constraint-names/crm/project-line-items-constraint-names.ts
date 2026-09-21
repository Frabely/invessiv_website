/** Constraint and index names of `project_line_items`, declared once for the model and the migration. */
export const ProjectLineItemsConstraintName = {
  ProjectForeignKey: "project_line_items_project_id_fkey",
  SourceTemplateForeignKey:
    "project_line_items_source_line_item_template_id_fkey",
  TitleCheck: "project_line_items_title_check",
  PriceCentsCheck: "project_line_items_price_cents_check",
  PricingModeCheck: "project_line_items_pricing_mode_check",
  RecurringIntervalCheck: "project_line_items_recurring_interval_check",
  PricingModeIntervalConsistencyCheck:
    "project_line_items_pricing_mode_interval_consistency_check",
  VersionCheck: "project_line_items_version_check",
  ProjectCreatedAtIndex: "project_line_items_project_created_at_idx",
} as const;

export type ProjectLineItemsConstraintName =
  (typeof ProjectLineItemsConstraintName)[keyof typeof ProjectLineItemsConstraintName];

export const PROJECT_LINE_ITEMS_CONSTRAINT_NAME_VALUES = [
  ProjectLineItemsConstraintName.ProjectForeignKey,
  ProjectLineItemsConstraintName.SourceTemplateForeignKey,
  ProjectLineItemsConstraintName.TitleCheck,
  ProjectLineItemsConstraintName.PriceCentsCheck,
  ProjectLineItemsConstraintName.PricingModeCheck,
  ProjectLineItemsConstraintName.RecurringIntervalCheck,
  ProjectLineItemsConstraintName.PricingModeIntervalConsistencyCheck,
  ProjectLineItemsConstraintName.VersionCheck,
  ProjectLineItemsConstraintName.ProjectCreatedAtIndex,
] as const;
