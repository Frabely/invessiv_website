import { z } from "zod";
import { LeadErrorCode } from "@/common/constants/leads/lead-error-codes";
import type { LeadDetailDto } from "@/common/contracts/leads/lead-detail.dto";

export type CreateLeadResult =
  | { ok: true; lead: LeadDetailDto }
  | { ok: false; code: typeof LeadErrorCode.EmailExists }
  | {
      ok: false;
      code: typeof LeadErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    };
