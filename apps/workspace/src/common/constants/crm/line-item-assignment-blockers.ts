/**
 * Why a template whose assignment acts on the project cannot be assigned to it right now. The
 * server decides again on submit; this only lets the dialog explain itself before that.
 */
export const LineItemAssignmentBlocker = {
  MissingHoursPermission: "missing_hours_permission",
  ProjectClosed: "project_closed",
  MissingProjectPermission: "missing_project_permission",
  ProjectApproved: "project_approved",
  LimitReached: "limit_reached",
} as const;

export type LineItemAssignmentBlocker =
  (typeof LineItemAssignmentBlocker)[keyof typeof LineItemAssignmentBlocker];

export const LINE_ITEM_ASSIGNMENT_BLOCKER_VALUES = [
  LineItemAssignmentBlocker.MissingHoursPermission,
  LineItemAssignmentBlocker.ProjectClosed,
  LineItemAssignmentBlocker.MissingProjectPermission,
  LineItemAssignmentBlocker.ProjectApproved,
  LineItemAssignmentBlocker.LimitReached,
] as const;
