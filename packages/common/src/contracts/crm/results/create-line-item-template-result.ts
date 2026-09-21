import type { z } from "zod";
import type { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";

export type CreateLineItemTemplateResult =
  | { ok: true; lineItemTemplate: LineItemTemplateDto }
  | {
      ok: false;
      code: typeof LineItemTemplateErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    };
