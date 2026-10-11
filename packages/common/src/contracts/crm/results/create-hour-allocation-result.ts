import type { z } from "zod";
import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { HourAllocationDto } from "@invessiv/common/contracts/crm/hours/hour-allocation.dto";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";

export type CreateHourAllocationResult =
  | {
      ok: true;
      allocation: HourAllocationDto;
      balance: CustomerHoursBalanceDto;
      project: ProjectHoursBalanceDto;
    }
  | {
      ok: false;
      code: typeof HoursErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  // Both carry the current figures so the dialog can show the real limit.
  | {
      ok: false;
      code:
        | typeof HoursErrorCode.InsufficientFreeHours
        | typeof HoursErrorCode.InsufficientReleasableHours;
      balance: CustomerHoursBalanceDto;
      project: ProjectHoursBalanceDto;
    }
  | {
      ok: false;
      code:
        | typeof HoursErrorCode.CustomerNotFound
        | typeof HoursErrorCode.ProjectNotFound
        | typeof HoursErrorCode.ProjectClosed;
    };
