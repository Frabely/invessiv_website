/** A task a time entry may name; only what the picker and the entry row need to show. */
export type TimeEntryTaskOption = {
  id: string;
  title: string;
  /** False for a cancelled task: it still names existing entries but is no longer offered. */
  linkable: boolean;
};
