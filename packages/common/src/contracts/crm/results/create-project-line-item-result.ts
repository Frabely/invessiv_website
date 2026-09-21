import type { z } from "zod";
import type { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";

export type CreateProjectLineItemResult =
  | { ok: true; projectLineItem: ProjectLineItemDto }
  | {
      ok: false;
      code: typeof ProjectLineItemErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | { ok: false; code: typeof ProjectLineItemErrorCode.ProjectNotFound }
  | {
      ok: false;
      code: typeof ProjectLineItemErrorCode.LineItemTemplateNotAssignable;
    };
