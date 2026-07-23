import { z } from "zod";
import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";
import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";

export type CreateLeadResult =
  | { ok: true; lead: LeadDetailDto }
  | { ok: false; code: typeof LeadErrorCode.EmailExists }
  | { ok: false; code: typeof LeadErrorCode.CompanyNameExists }
  | { ok: false; code: typeof LeadErrorCode.SocialProfileExists }
  | {
      ok: false;
      code: typeof LeadErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    };
