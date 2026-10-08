/** Query parameters of the time entry list endpoint. */
export const TimeEntryQueryParam = {
  Cursor: "cursor",
} as const;

export type TimeEntryQueryParam =
  (typeof TimeEntryQueryParam)[keyof typeof TimeEntryQueryParam];
