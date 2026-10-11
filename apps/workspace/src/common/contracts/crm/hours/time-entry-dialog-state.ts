import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";

/** A single form is shared by task shortcuts and the project's hours section. */
export type TimeEntryDialogState = {
  entry: TimeEntryDto | null;
  taskId: string | null;
};
