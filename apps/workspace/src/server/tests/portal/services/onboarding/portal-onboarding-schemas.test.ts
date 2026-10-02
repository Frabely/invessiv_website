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

describe("portalOnboardingSchemas.groupEntry", () => {
  const parseEntry = (input: unknown) =>
    portalOnboardingSchemas.groupEntry.safeParse(input);

  it("accepts a client id and its group field, lowercasing both", () => {
    expect(
      parseEntry({ id: CHOICE.toUpperCase(), fieldId: FIELD.toUpperCase() }),
    ).toMatchObject({ success: true, data: { id: CHOICE, fieldId: FIELD } });
  });

  it.each([
    ["a missing id", { fieldId: FIELD }],
    ["an id that is no uuid", { id: "1", fieldId: FIELD }],
    ["an unknown key", { id: CHOICE, fieldId: FIELD, position: 0 }],
  ])("rejects %s", (_name, input) => {
    expect(parseEntry(input).success).toBe(false);
  });
});

describe("portalOnboardingSchemas.moveGroupEntry", () => {
  it("accepts one step up or down and nothing else", () => {
    const parseMove = (direction: unknown) =>
      portalOnboardingSchemas.moveGroupEntry.safeParse({ direction }).success;
    expect([parseMove(-1), parseMove(1)]).toEqual([true, true]);
    expect([parseMove(0), parseMove(2), parseMove("1")]).toEqual([
      false,
      false,
      false,
    ]);
  });
});

describe("portalOnboardingSchemas.attachFile", () => {
  const parseAttach = (input: unknown) =>
    portalOnboardingSchemas.attachFile.safeParse(input);

  it("accepts a slot with a file on block level and within an entry", () => {
    expect(parseAttach({ ...slot, fileId: CHOICE }).success).toBe(true);
    expect(
      parseAttach({ fieldId: FIELD, groupEntryId: CHOICE, fileId: CHOICE })
        .success,
    ).toBe(true);
  });

  it.each([
    ["a missing file", slot],
    ["a missing entry id", { fieldId: FIELD, fileId: CHOICE }],
    ["a file that is no uuid", { ...slot, fileId: "logo.png" }],
    ["an unknown key", { ...slot, fileId: CHOICE, customerId: FIELD }],
  ])("rejects %s", (_name, input) => {
    expect(parseAttach(input).success).toBe(false);
  });
});

describe("portalOnboardingSchemas.confirmServices", () => {
  const parseConfirm = (input: unknown) =>
    portalOnboardingSchemas.confirmServices.safeParse(input);

  it("accepts a confirmation without remark and trims a remark", () => {
    expect(parseConfirm({ confirmed: true, note: null })).toMatchObject({
      success: true,
      data: { note: null },
    });
    expect(parseConfirm({ confirmed: true, note: "  Passt fast.  " })).toEqual({
      success: true,
      data: { confirmed: true, note: "Passt fast." },
    });
    expect(
      parseConfirm({
        confirmed: true,
        note: "x".repeat(QUESTIONNAIRE_LIMITS.noteMaxLength),
      }).success,
    ).toBe(true);
  });

  it.each([
    ["a remark without text", { confirmed: true, note: "  " }],
    [
      "a remark above the limit",
      {
        confirmed: true,
        note: "x".repeat(QUESTIONNAIRE_LIMITS.noteMaxLength + 1),
      },
    ],
    ["a missing remark", { confirmed: true }],
    ["a withdrawal", { confirmed: false, note: null }],
    ["an unknown key", { confirmed: true, note: null, fieldId: FIELD }],
  ])("rejects %s", (_name, input) => {
    expect(parseConfirm(input).success).toBe(false);
  });
});
