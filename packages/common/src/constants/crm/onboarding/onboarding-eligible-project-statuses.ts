import { ProjectStatus } from "../project-statuses";

/** An onboarding starts a project; paused, finished and archived projects get none. */
export const ONBOARDING_ELIGIBLE_PROJECT_STATUS_VALUES = [
  ProjectStatus.Planned,
  ProjectStatus.Active,
] as const;
