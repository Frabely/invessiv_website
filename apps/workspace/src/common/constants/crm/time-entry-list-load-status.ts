/** Where the time entry list of a project stands; the section shows a different state for each. */
export const TimeEntryListLoadStatus = {
  Loading: "loading",
  Ready: "ready",
  Error: "error",
} as const;

export type TimeEntryListLoadStatus =
  (typeof TimeEntryListLoadStatus)[keyof typeof TimeEntryListLoadStatus];
