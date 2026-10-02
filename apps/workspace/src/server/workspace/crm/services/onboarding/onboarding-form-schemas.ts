import { z } from "zod";

import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { ONBOARDING_CLARIFICATION_MODE_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

// Requests of the form itself. Block heads and fields of a form are validated by
// `questionnaireSchemas`, exactly like their catalog counterparts.

const expectedFormVersion = z.int().positive();

export const onboardingFormSchemas = {
  entityId: z.uuid(),
  start: z.strictObject({ templateId: z.uuid().nullable() }),
  addBlock: z.union([
    z.strictObject({ catalogBlockId: z.uuid(), expectedFormVersion }),
    // An own block is never company-wide, so the request carries no such flag.
    questionnaireSchemas.createBlock
      .omit({ carryOver: true })
      .extend({ expectedFormVersion }),
  ]),
  removeBlock: z.strictObject({ expectedFormVersion }),
  moveBlock: z.strictObject({
    direction: z.union([z.literal(-1), z.literal(1)]),
    expectedFormVersion,
  }),
  release: z.strictObject({
    expectedVersion: expectedFormVersion,
    acknowledgeWarnings: z.boolean(),
  }),
  // A question needs its way and its text; the other two results carry neither.
  review: z.discriminatedUnion("reviewStatus", [
    z.strictObject({
      reviewStatus: z.enum([
        OnboardingBlockReviewStatus.Pending,
        OnboardingBlockReviewStatus.Complete,
      ]),
      expectedVersion: expectedFormVersion,
    }),
    z.strictObject({
      reviewStatus: z.literal(OnboardingBlockReviewStatus.Clarification),
      clarificationMode: z.enum(ONBOARDING_CLARIFICATION_MODE_VALUES),
      note: z.string().trim().min(1).max(QUESTIONNAIRE_LIMITS.noteMaxLength),
      expectedVersion: expectedFormVersion,
    }),
  ]),
  requestChanges: z.strictObject({ expectedVersion: expectedFormVersion }),
  // The call date stays a plain string here: an empty or future day is a missing precondition
  // with its own code, not a malformed request.
  complete: z.strictObject({
    expectedVersion: expectedFormVersion,
    callHeldOn: z.string(),
    advancePhase: z.boolean(),
  }),
} as const;
