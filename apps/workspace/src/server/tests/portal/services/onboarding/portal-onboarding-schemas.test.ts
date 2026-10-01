import { describe, expect, it } from "vitest";

import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { portalOnboardingSchemas } from "@/server/portal/services/onboarding/portal-onboarding-schemas";

const FIELD = "33333333-3333-4333-8333-333333333333";
const CHOICE = "44444444-4444-4444-8444-444444444444";
const slot = { fieldId: FIELD, groupEntryId: null };
const parse = (input: unknown) =>
  portalOnboardingSchemas.answer.safeParse(input);

describe("portalOnboardingSchemas.answer", () => {
  it("accepts a text slot and a choice slot, lowercasing ids", () => {
    expect(parse({ ...slot, values: ["Acme"] })).toMatchObject({
      success: true,
    });
    const upper = parse({
      fieldId: "ABCDEFAB-CDEF-4ABC-8DEF-ABCDEFABCDEF",
      groupEntryId: null,
      choiceIds: [CHOICE],
    });
    expect(upper).toMatchObject({
      success: true,
      data: {
        fieldId: "abcdefab-cdef-4abc-8def-abcdefabcdef",
        choiceIds: [CHOICE],
      },
    });
  });

  it("accepts an empty list, which clears the slot", () => {
    expect(parse({ ...slot, values: [] }).success).toBe(true);
    expect(parse({ ...slot, choiceIds: [] }).success).toBe(true);
  });

  it.each([
    ["no content", slot],
    ["both kinds of content", { ...slot, values: [], choiceIds: [] }],
    ["an unknown key", { ...slot, values: [], customerId: FIELD }],
    ["a missing entry id", { fieldId: FIELD, values: [] }],
    ["a second text value", { ...slot, values: ["a", "b"] }],
    ["a duplicate choice", { ...slot, choiceIds: [CHOICE, CHOICE] }],
    ["a choice that is no uuid", { ...slot, choiceIds: ["a"] }],
    ["a field that is no uuid", { ...slot, fieldId: "name", values: [] }],
    [
      "a value above the stored ceiling",
      {
        ...slot,
        values: ["x".repeat(QUESTIONNAIRE_LIMITS.storedValueMaxLength + 1)],
      },
    ],
  ])("rejects %s", (_name, input) => {
    expect(parse(input).success).toBe(false);
  });
});
