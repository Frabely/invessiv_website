import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";

/** Project facts available to the assignment picker, after its caller's access checks. */
export type LineItemAssignmentProject = {
  id: string;
  status: ProjectStatus | null;
  feedbackRoundPositions: readonly number[];
  hasReadableTrack: boolean;
};
