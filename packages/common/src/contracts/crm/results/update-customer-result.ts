import type { z } from "zod";
import type { CustomerErrorCode } from "@invessiv/common/constants/crm/errors/customer-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";

export type UpdateCustomerResult =
  | { ok: true; customer: CustomerDetailDto }
  | {
      ok: false;
      code: typeof CustomerErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code:
        | typeof CustomerErrorCode.CustomerNotFound
        | typeof CustomerErrorCode.DisplayNameTaken;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<CustomerDetailDto>;
    };
