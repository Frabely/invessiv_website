export const TaskErrorCode = {
  TaskNotFound: "TASK_NOT_FOUND",
  ProjectNotFound: "PROJECT_NOT_FOUND",
  AssigneeNotActive: "ASSIGNEE_NOT_ACTIVE",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;

export type TaskErrorCode = (typeof TaskErrorCode)[keyof typeof TaskErrorCode];

export const TASK_ERROR_CODE_VALUES = Object.values(
  TaskErrorCode,
) as readonly TaskErrorCode[];
