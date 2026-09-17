import type { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { ListCustomersResult } from "@invessiv/common/contracts/crm/results/list-customers-result";

/** A 409 version conflict carries the fresh state so the dialog keeps the user's input. */
export type CustomerMutationClientResult =
  | { ok: true; customer: CustomerDetailDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: CustomerDetailDto;
    }
  | { ok: false; code: CustomerErrorCode };

export type CustomerReadClientResult =
  | { ok: true; customer: CustomerDetailDto }
  | { ok: false; code: CustomerErrorCode };

export type CustomerSearchClientResult =
  | { ok: true; result: ListCustomersResult }
  | { ok: false; code: CustomerErrorCode };
