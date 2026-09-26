/** Constraint and index names of `tasks`, declared once for the model and the migration. */
export const TasksConstraintName = {
  ProjectForeignKey: "tasks_project_id_fkey",
  AssigneeForeignKey: "tasks_assignee_member_id_fkey",
  CompletedByForeignKey: "tasks_completed_by_member_id_fkey",
  CompletedByPortalMembershipForeignKey:
    "tasks_completed_by_portal_membership_id_fkey",
  TitleCheck: "tasks_title_check",
  StatusCheck: "tasks_status_check",
  ActionSideCheck: "tasks_action_side_check",
  CustomerActionVisibleCheck: "tasks_customer_action_visible_check",
  CompletionConsistencyCheck: "tasks_completion_consistency_check",
  PortalCompletionCustomerSideCheck:
    "tasks_portal_completion_customer_side_check",
  VersionCheck: "tasks_version_check",
  ProjectStatusDueIndex: "tasks_project_status_due_idx",
  OpenAssigneeDueIndex: "tasks_open_assignee_due_idx",
} as const;

export type TasksConstraintName =
  (typeof TasksConstraintName)[keyof typeof TasksConstraintName];

export const TASKS_CONSTRAINT_NAME_VALUES = [
  TasksConstraintName.ProjectForeignKey,
  TasksConstraintName.AssigneeForeignKey,
  TasksConstraintName.CompletedByForeignKey,
  TasksConstraintName.CompletedByPortalMembershipForeignKey,
  TasksConstraintName.TitleCheck,
  TasksConstraintName.StatusCheck,
  TasksConstraintName.ActionSideCheck,
  TasksConstraintName.CustomerActionVisibleCheck,
  TasksConstraintName.CompletionConsistencyCheck,
  TasksConstraintName.PortalCompletionCustomerSideCheck,
  TasksConstraintName.VersionCheck,
  TasksConstraintName.ProjectStatusDueIndex,
  TasksConstraintName.OpenAssigneeDueIndex,
] as const;
