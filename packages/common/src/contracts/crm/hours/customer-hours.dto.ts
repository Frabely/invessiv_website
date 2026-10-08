import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { HourAllocationDto } from "@invessiv/common/contracts/crm/hours/hour-allocation.dto";
import type { HourPurchaseDto } from "@invessiv/common/contracts/crm/hours/hour-purchase.dto";
import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";

/** Everything the cockpit shows about one customer's hours, already narrowed to the actor's scope. */
export interface CustomerHoursDto {
  /** Null when the actor may read hours only in single projects: the customer-wide stock stays hidden. */
  balance: CustomerHoursBalanceDto | null;
  /** One entry per project the actor may read hours in, including projects without any allocation. */
  projects: CustomerHoursProjectDto[];
  /** Newest first, capped at `HoursLimits.HistoryPreviewSize`. Empty without customer-wide read access. */
  purchases: HourPurchaseDto[];
  /** Newest first, capped; only allocations of readable projects. */
  allocations: HourAllocationDto[];
}
