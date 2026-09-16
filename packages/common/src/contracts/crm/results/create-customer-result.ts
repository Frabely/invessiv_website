import type { z } from "zod";
import type { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";

/**
 * `OwnerInactive` only occurs when the creating member is deactivated in parallel: the
 * owner membership is locked and re-checked inside the transaction.
 */
export type CreateCustomerResult =
  | { ok: true; customer: CustomerDetailDto }
  | {
      ok: false;
      code: typeof CustomerErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code:
        | typeof CustomerErrorCode.DisplayNameTaken
        | typeof CustomerErrorCode.OwnerInactive;
    };
