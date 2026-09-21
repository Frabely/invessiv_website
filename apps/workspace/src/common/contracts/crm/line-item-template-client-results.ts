import type { LineItemTemplateErrorCode } from "@invessiv/common/constants/crm/errors/line-item-template-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";

/** A 409 version conflict carries the fresh state so the dialog keeps the user's input. */
export type LineItemTemplateMutationClientResult =
  | { ok: true; lineItemTemplate: LineItemTemplateDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: LineItemTemplateDto;
    }
  | { ok: false; code: LineItemTemplateErrorCode };
