import type { z } from "zod";
import type { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";

export type UpdateLineItemTemplateResult =
  | { ok: true; lineItemTemplate: LineItemTemplateDto }
  | {
      ok: false;
      code: typeof LineItemTemplateErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code: typeof LineItemTemplateErrorCode.LineItemTemplateNotFound;
    }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<LineItemTemplateDto>;
    };
