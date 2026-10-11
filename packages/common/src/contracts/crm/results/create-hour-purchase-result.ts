import type { z } from "zod";
import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { HourPurchaseDto } from "@invessiv/common/contracts/crm/hours/hour-purchase.dto";

export type CreateHourPurchaseResult =
  | { ok: true; purchase: HourPurchaseDto; balance: CustomerHoursBalanceDto }
  | {
      ok: false;
      code: typeof HoursErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  // Carries the balance so the dialog can show how far a correction may actually go.
  | {
      ok: false;
      code: typeof HoursErrorCode.BelowAllocatedHours;
      balance: CustomerHoursBalanceDto;
    }
  | { ok: false; code: typeof HoursErrorCode.CustomerNotFound };
