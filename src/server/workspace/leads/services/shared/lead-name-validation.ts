import { type RefinementCtx, z } from "zod";
import { LeadValidationIssueCode } from "@/common/constants/leads/errors/lead-error-codes";
import type { LeadNameShape } from "@/common/contracts/leads/validation/lead-name-shape";

const ZOD_CUSTOM_ISSUE_CODE = "custom" as const;
const MISSING_LEAD_NAME_PATH = ["last_name"] as const;

export function hasAtLeastOneLeadName(data: LeadNameShape): boolean {
  return Boolean(data.last_name?.trim()) || Boolean(data.company_name?.trim());
}

export function addMissingLeadNameIssue(context: RefinementCtx) {
  context.addIssue({
    code: ZOD_CUSTOM_ISSUE_CODE,
    message: LeadValidationIssueCode.LastNameOrCompanyNameRequired,
    path: [...MISSING_LEAD_NAME_PATH],
  });
}

export function missingLeadNameError(): z.ZodError {
  return new z.ZodError([
    {
      code: ZOD_CUSTOM_ISSUE_CODE,
      message: LeadValidationIssueCode.LastNameOrCompanyNameRequired,
      path: [...MISSING_LEAD_NAME_PATH],
    },
  ]);
}
