export const PortalTaskErrorCode = {
  NotFound: "not_found",
  Validation: "validation",
  /** Neither the project owner nor the customer owner is active, so nobody could take the task. */
  NoAssignee: "no_assignee",
  LimitReached: "limit_reached",
  Unavailable: "unavailable",
} as const;

export type PortalTaskErrorCode =
  (typeof PortalTaskErrorCode)[keyof typeof PortalTaskErrorCode];

export const PORTAL_TASK_ERROR_CODE_VALUES = [
  PortalTaskErrorCode.NotFound,
  PortalTaskErrorCode.Validation,
  PortalTaskErrorCode.NoAssignee,
  PortalTaskErrorCode.LimitReached,
  PortalTaskErrorCode.Unavailable,
] as const;
