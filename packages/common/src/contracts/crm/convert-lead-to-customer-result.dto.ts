import type { LeadConversionErrorCode } from "@invessiv/common/constants/crm/errors/lead-conversion-error-codes";

export type ConvertLeadToCustomerResultDto =
  | {
      /** Marks a successful conversion or idempotent retry. */
      ok: true;
      /** Identifier of the created or previously linked customer. */
      customerId: string;
    }
  | {
      /** Marks an expected conversion failure. */
      ok: false;
      /** Stable machine-readable failure reason. */
      code: LeadConversionErrorCode;
      /** Validation details when the request body is invalid. */
      errors?: unknown[];
    };
