/** Constraint and index names of `customers`, declared once for the model and the duplicate mapping. */
export const CustomersConstraintName = {
  DisplayNameCheck: "customers_display_name_check",
  CustomerTypeCheck: "customers_customer_type_check",
  StatusCheck: "customers_status_check",
  DefaultHourlyRateCentsCheck: "customers_default_hourly_rate_cents_check",
  RetentionReviewAfterDaysCheck: "customers_retention_review_after_days_check",
  VersionCheck: "customers_version_check",
  CustomerNumberUnique: "customers_customer_number_uidx",
  IdCustomerNumberUnique: "customers_id_customer_number_uidx",
  DisplayNameLowerUnique: "customers_display_name_lower_uidx",
  StatusCreatedAtIndex: "customers_status_created_at_idx",
  CategoryIdIndex: "customers_category_id_idx",
  OwnerMemberIdIndex: "customers_owner_member_id_idx",
} as const;

export type CustomersConstraintName =
  (typeof CustomersConstraintName)[keyof typeof CustomersConstraintName];

export const CUSTOMERS_CONSTRAINT_NAME_VALUES = [
  CustomersConstraintName.DisplayNameCheck,
  CustomersConstraintName.CustomerTypeCheck,
  CustomersConstraintName.StatusCheck,
  CustomersConstraintName.DefaultHourlyRateCentsCheck,
  CustomersConstraintName.RetentionReviewAfterDaysCheck,
  CustomersConstraintName.VersionCheck,
  CustomersConstraintName.CustomerNumberUnique,
  CustomersConstraintName.IdCustomerNumberUnique,
  CustomersConstraintName.DisplayNameLowerUnique,
  CustomersConstraintName.StatusCreatedAtIndex,
  CustomersConstraintName.CategoryIdIndex,
  CustomersConstraintName.OwnerMemberIdIndex,
] as const;
