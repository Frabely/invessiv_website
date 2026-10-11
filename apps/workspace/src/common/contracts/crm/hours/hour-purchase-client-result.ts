import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { HourPurchaseDto } from "@invessiv/common/contracts/crm/hours/hour-purchase.dto";

/** A rejected write may carry the current balance, so the dialog can show the real limit. */
export type HourPurchaseClientResult =
  | { ok: true; purchase: HourPurchaseDto; balance: CustomerHoursBalanceDto }
  | {
      ok: false;
      code: HoursErrorCode;
      balance: CustomerHoursBalanceDto | null;
    };
