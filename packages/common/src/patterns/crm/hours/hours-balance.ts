import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";

/** The one place the customer-wide figures are derived, shared by cockpit, commands and portal. */
export function computeCustomerHoursBalance(sums: {
  purchasedMinutes: number;
  allocatedMinutes: number;
  usedMinutes: number;
  goodwillMinutes: number;
}): CustomerHoursBalanceDto {
  return {
    purchasedMinutes: sums.purchasedMinutes,
    allocatedMinutes: sums.allocatedMinutes,
    freeMinutes: sums.purchasedMinutes - sums.allocatedMinutes,
    usedMinutes: sums.usedMinutes,
    goodwillMinutes: sums.goodwillMinutes,
    remainingMinutes: sums.purchasedMinutes - sums.usedMinutes,
  };
}

/** An overdrawn project has nothing to release; it never draws from another project either. */
export function computeProjectHoursBalance(sums: {
  projectId: string;
  allocatedMinutes: number;
  usedMinutes: number;
  goodwillMinutes: number;
}): ProjectHoursBalanceDto {
  const remainingMinutes = sums.allocatedMinutes - sums.usedMinutes;
  return {
    projectId: sums.projectId,
    allocatedMinutes: sums.allocatedMinutes,
    usedMinutes: sums.usedMinutes,
    goodwillMinutes: sums.goodwillMinutes,
    remainingMinutes,
    releasableMinutes: Math.max(0, remainingMinutes),
  };
}
