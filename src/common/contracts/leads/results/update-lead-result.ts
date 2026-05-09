import { z } from "zod";
import { LeadErrorCode } from "@/common/constants/leads/errors/lead-error-codes";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";

export type UpdateLeadResult =
  | { ok: true; lead: LeadDetailDto }
  | { ok: false; code: typeof LeadErrorCode.EmailExists }
  | { ok: false; code: typeof LeadErrorCode.NotFound }
  | {
      ok: false;
      code: typeof LeadErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    };
