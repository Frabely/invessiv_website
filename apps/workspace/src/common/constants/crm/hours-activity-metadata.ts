/** Marks an activity as a purchase row of the customer's hours ledger. */
export const HOUR_PURCHASE_ACTIVITY_ENTITY = "hour_purchase";

/** Marks an activity as an allocation or release of hours on a project. */
export const HOUR_ALLOCATION_ACTIVITY_ENTITY = "hour_allocation";

/** Marks an activity as belonging to a time entry of a project. */
export const TIME_ENTRY_ACTIVITY_ENTITY = "time_entry";

/**
 * The time entry fields whose change is recorded. The description is named but never copied:
 * free text does not belong in an append-only log.
 */
export const TimeEntryActivityField = {
  Duration: "duration_minutes",
  PerformedOn: "performed_on",
  Billable: "billable",
  Task: "task_id",
  Description: "description",
  Deleted: "deleted",
} as const;

export type TimeEntryActivityField =
  (typeof TimeEntryActivityField)[keyof typeof TimeEntryActivityField];
