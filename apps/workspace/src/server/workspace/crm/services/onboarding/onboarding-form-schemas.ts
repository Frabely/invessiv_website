import { z } from "zod";

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
} as const;
