import type { z } from "zod";
import type { ServiceTemplateErrorCode } from "@invessiv/common/constants/crm/errors/service-template-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { ServiceTemplateDto } from "@invessiv/common/contracts/crm/service-template.dto";

export type UpdateServiceTemplateResult =
  | { ok: true; serviceTemplate: ServiceTemplateDto }
  | {
      ok: false;
      code: typeof ServiceTemplateErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | { ok: false; code: typeof ServiceTemplateErrorCode.ServiceTemplateNotFound }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<ServiceTemplateDto>;
    };
