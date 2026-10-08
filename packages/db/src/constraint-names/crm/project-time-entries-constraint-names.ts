/** Constraint and index names of `project_time_entries`, declared once for model and migration. */
export const ProjectTimeEntriesConstraintName = {
  CustomerForeignKey: "project_time_entries_customer_fkey",
  ProjectCustomerForeignKey: "project_time_entries_project_customer_fkey",
  TaskProjectForeignKey: "project_time_entries_task_project_fkey",
  PerformedByMemberForeignKey: "project_time_entries_performed_by_member_fkey",
  DurationCheck: "project_time_entries_duration_check",
  DescriptionCheck: "project_time_entries_description_check",
  VersionCheck: "project_time_entries_version_check",
  ProjectPerformedIndex: "project_time_entries_project_performed_idx",
  CustomerPerformedIndex: "project_time_entries_customer_performed_idx",
  TaskIndex: "project_time_entries_task_idx",
} as const;
