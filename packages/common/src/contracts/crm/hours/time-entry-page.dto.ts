import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";

/** One page of a project's time entries, newest first. */
export interface TimeEntryPageDto {
  /** Entries of this page in display order. */
  entries: TimeEntryDto[];
  /** Opaque position after the last entry; null when no older entry exists. */
  nextCursor: string | null;
}
