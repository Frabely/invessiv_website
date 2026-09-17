export const ProjectStatus = {
  Planned: "planned",
  Active: "active",
  Paused: "paused",
  Completed: "completed",
  Cancelled: "cancelled",
  Archived: "archived",
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const PROJECT_STATUS_VALUES = [
  ProjectStatus.Planned,
  ProjectStatus.Active,
  ProjectStatus.Paused,
  ProjectStatus.Completed,
  ProjectStatus.Cancelled,
  ProjectStatus.Archived,
] as const;
