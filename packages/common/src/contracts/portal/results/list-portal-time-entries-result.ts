import type { PortalHoursErrorCode } from "../../../constants/portal/portal-hours-error-codes";
import type { PortalTimeEntryPageDto } from "../portal-time-entry-page.dto";

/**
 * `not_found` is a reader without `portal.hours.entries.read`; `validation` an unreadable cursor
 * or a project filter the portal does not show for this company.
 */
export type ListPortalTimeEntriesResult =
  | { ok: true; page: PortalTimeEntryPageDto }
  | {
      ok: false;
      code:
        | typeof PortalHoursErrorCode.NotFound
        | typeof PortalHoursErrorCode.Validation;
    };
