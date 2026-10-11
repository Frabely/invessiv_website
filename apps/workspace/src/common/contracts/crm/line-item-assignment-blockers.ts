import type { LineItemAssignmentBlocker } from "@/common/constants/crm/line-item-assignment-blockers";

/** Per project: what stands in the way of the two template kinds that act on the project. */
export type LineItemAssignmentBlockers = {
  /** Null when hours can be credited and allocated to this project by this member. */
  hours: LineItemAssignmentBlocker | null;
  /** Null when this member can add a further feedback round to this project. */
  feedbackRound: LineItemAssignmentBlocker | null;
};
