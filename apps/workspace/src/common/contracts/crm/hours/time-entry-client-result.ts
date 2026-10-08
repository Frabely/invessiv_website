import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";

/**
 * Result of booking, changing or deleting a time entry. `timeEntry` is null after a delete. A 409
 * version conflict carries the fresh entry so the dialog keeps the user's input.
 */
export type TimeEntryClientResult =
  | {
      ok: true;
      timeEntry: TimeEntryDto | null;
      project: ProjectHoursBalanceDto;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: TimeEntryDto;
    }
  | { ok: false; code: HoursErrorCode };
