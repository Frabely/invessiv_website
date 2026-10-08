/** Constraint and index names of `customer_hour_purchases`, declared once for model and migration. */
export const CustomerHourPurchasesConstraintName = {
  CustomerForeignKey: "customer_hour_purchases_customer_fkey",
  CreatedByMemberForeignKey: "customer_hour_purchases_created_by_member_fkey",
  IdempotencyKeyUnique: "customer_hour_purchases_idempotency_key",
  KindCheck: "customer_hour_purchases_kind_check",
  SourceCheck: "customer_hour_purchases_source_check",
  MinutesCheck: "customer_hour_purchases_minutes_check",
  KindSignCheck: "customer_hour_purchases_kind_sign_check",
  NoteCheck: "customer_hour_purchases_note_check",
  CustomerPurchasedIndex: "customer_hour_purchases_customer_purchased_idx",
} as const;
