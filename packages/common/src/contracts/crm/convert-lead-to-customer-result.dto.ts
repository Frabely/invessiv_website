import type { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";

export type ConvertLeadToCustomerResultDto =
  | {
      /** Marks a successful conversion or idempotent retry. */
      ok: true;
      /** The created or previously linked customer. */
      customer: CustomerDetailDto;
    }
  | {
      /** Marks an expected conversion failure. */
      ok: false;
      /** Stable machine-readable failure reason. */
      code: LeadConversionErrorCode;
      /** Validation details when the request body is invalid. */
      errors?: unknown[];
    };
