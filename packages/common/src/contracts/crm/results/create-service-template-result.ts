import type { z } from "zod";
import type { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";

export type CreateServiceTemplateResult =
  | { ok: true; serviceTemplate: ServiceTemplateDto }
  | {
      ok: false;
      code: typeof ServiceTemplateErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    };
