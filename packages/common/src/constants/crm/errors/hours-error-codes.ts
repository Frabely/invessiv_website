export const HoursErrorCode = {
  CustomerNotFound: "CUSTOMER_NOT_FOUND",
  ProjectNotFound: "PROJECT_NOT_FOUND",
  TimeEntryNotFound: "TIME_ENTRY_NOT_FOUND",
  ProjectClosed: "PROJECT_CLOSED",
  InsufficientFreeHours: "INSUFFICIENT_FREE_HOURS",
  InsufficientReleasableHours: "INSUFFICIENT_RELEASABLE_HOURS",
  BelowAllocatedHours: "BELOW_ALLOCATED_HOURS",
  TaskNotLinkable: "TASK_NOT_LINKABLE",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type HoursErrorCode =
  (typeof HoursErrorCode)[keyof typeof HoursErrorCode];

export const HOURS_ERROR_CODE_VALUES = Object.values(
  HoursErrorCode,
) as readonly HoursErrorCode[];
