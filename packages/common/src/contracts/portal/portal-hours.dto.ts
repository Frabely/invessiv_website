import type { PortalEarlierProjectsHoursDto } from "./portal-earlier-projects-hours.dto";
import type { PortalHourPurchaseDto } from "./portal-hour-purchase.dto";
import type { PortalHoursBalanceDto } from "./portal-hours-balance.dto";
import type { PortalProjectHoursDto } from "./portal-project-hours.dto";

/**
 * What the dashboard widget and the dialog know about the company's hours. Time entries are not
 * part of it; the dialog loads them page by page once it opens.
 */
export interface PortalHoursDto {
  /** Company-wide figures over all projects, including the ones the portal hides. */
  balance: PortalHoursBalanceDto;
  /** All portal-visible projects, including those without hours, in the dashboard's project order. */
  projects: PortalProjectHoursDto[];
  /** Everything booked on projects the portal does not show; null when there is nothing. Keeps the sums honest. */
  earlierProjects: PortalEarlierProjectsHoursDto | null;
  /** Newest first, capped at `HoursLimits.HistoryPreviewSize`. */
  purchases: PortalHourPurchaseDto[];
  /** True with `portal.hours.entries.read`; the dialog then offers the entry list. */
  canReadEntries: boolean;
}
