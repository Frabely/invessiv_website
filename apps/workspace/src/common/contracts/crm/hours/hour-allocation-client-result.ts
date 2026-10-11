import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { HourAllocationDto } from "@invessiv/common/contracts/crm/hours/hour-allocation.dto";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";

/** A rejected write may carry the current figures, so the dialog can show the real limit. */
export type HourAllocationClientResult =
  | {
      ok: true;
      allocation: HourAllocationDto;
      balance: CustomerHoursBalanceDto;
      project: ProjectHoursBalanceDto;
    }
  | {
      ok: false;
      code: HoursErrorCode;
      balance: CustomerHoursBalanceDto | null;
      project: ProjectHoursBalanceDto | null;
    };
