import { type RefinementCtx, z } from "zod";
import { leadSchema } from "@/server/workspace/leads/shared/lead-schema";
import {
  addMissingLeadNameIssue,
  hasAtLeastOneLeadName,
} from "@/server/workspace/leads/services/shared/lead-name-validation";
import type { LeadNameShape } from "@/common/contracts/leads/validation/lead-name-shape";

function validateLeadName(value: LeadNameShape, context: RefinementCtx) {
  if (!hasAtLeastOneLeadName(value)) {
    addMissingLeadNameIssue(context);
  }
}

export const createLeadSchema = z
  .object(leadSchema)
  .superRefine(validateLeadName);
