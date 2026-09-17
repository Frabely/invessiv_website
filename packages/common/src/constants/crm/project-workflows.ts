export const ProjectWorkflowKey = {
  StandardWebV1: "standard_web_v1",
} as const;

export type ProjectWorkflowKey =
  (typeof ProjectWorkflowKey)[keyof typeof ProjectWorkflowKey];

export const PROJECT_WORKFLOW_KEY_VALUES = [
  ProjectWorkflowKey.StandardWebV1,
] as const;
