import type { PortalTimeEntryDto } from "./portal-time-entry.dto";

/** One page of the company's time entries, newest first. */
export interface PortalTimeEntryPageDto {
  /** Entries of this page in display order. */
  entries: PortalTimeEntryDto[];
  /** Opaque position after the last entry; null when no older entry exists. */
  nextCursor: string | null;
}
