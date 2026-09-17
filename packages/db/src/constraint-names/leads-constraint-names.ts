/** Constraint and index names of `leads`, declared once for the model and the duplicate mapping. */
export const LeadsConstraintName = {
  ScoreCheck: "leads_score_check",
  SourceCheck: "leads_source_check",
  LeadStatusCheck: "leads_lead_status_check",
  EmailLowerUnique: "leads_email_lower_uidx",
  CompanyNameLowerUnique: "leads_company_name_lower_uidx",
  SourceCreatedAtIndex: "leads_source_created_at_idx",
  CategoryCreatedAtIndex: "leads_category_created_at_idx",
  CustomerIdIndex: "leads_customer_id_idx",
  ExternalGuidUnique: "leads_external_guid_uidx",
} as const;

export type LeadsConstraintName =
  (typeof LeadsConstraintName)[keyof typeof LeadsConstraintName];

export const LEADS_CONSTRAINT_NAME_VALUES = [
  LeadsConstraintName.ScoreCheck,
  LeadsConstraintName.SourceCheck,
  LeadsConstraintName.LeadStatusCheck,
  LeadsConstraintName.EmailLowerUnique,
  LeadsConstraintName.CompanyNameLowerUnique,
  LeadsConstraintName.SourceCreatedAtIndex,
  LeadsConstraintName.CategoryCreatedAtIndex,
  LeadsConstraintName.CustomerIdIndex,
  LeadsConstraintName.ExternalGuidUnique,
] as const;
