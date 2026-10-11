/** Constraint and index names of `project_hour_allocations`, declared once for model and migration. */
export const ProjectHourAllocationsConstraintName = {
  CustomerForeignKey: "project_hour_allocations_customer_fkey",
  ProjectCustomerForeignKey: "project_hour_allocations_project_customer_fkey",
  CreatedByMemberForeignKey: "project_hour_allocations_created_by_member_fkey",
  IdempotencyKeyUnique: "project_hour_allocations_idempotency_key",
  MinutesCheck: "project_hour_allocations_minutes_check",
  NoteCheck: "project_hour_allocations_note_check",
  CustomerCreatedIndex: "project_hour_allocations_customer_created_idx",
  ProjectIndex: "project_hour_allocations_project_idx",
} as const;
