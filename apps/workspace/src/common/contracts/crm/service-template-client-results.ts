import type { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";

/** A 409 version conflict carries the fresh state so the dialog keeps the user's input. */
export type ServiceTemplateMutationClientResult =
  | { ok: true; serviceTemplate: ServiceTemplateDto }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      current: ServiceTemplateDto;
    }
  | { ok: false; code: ServiceTemplateErrorCode };
