import { z } from "zod";
import { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";

/**
 * Deliberately without an error code for duplicate company names: duplicates are allowed.
 * Task 04 shows a confirmable warning instead of an `ok: false` result.
 */
export type CreateCustomerResult =
  | { ok: true; customer: CustomerDetailDto }
  | {
      ok: false;
      code: typeof CustomerErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | { ok: false; code: typeof CustomerErrorCode.Internal };
