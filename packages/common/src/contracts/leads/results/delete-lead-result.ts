import { LeadErrorCode } from "@invessiv/common/constants/leads/errors/lead-error-codes";

export type DeleteLeadResult =
  | { ok: true }
  | { ok: false; code: typeof LeadErrorCode.NotFound };
