import { describe, expect, it } from "vitest";

import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { questionnaireSchemas } from "@/server/workspace/crm/services/questionnaire/questionnaire-schemas";

function fieldInput(overrides: Record<string, unknown> = {}) {
  return {
    key: "company_name",
    requirement: QuestionnaireFieldRequirement.Required,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: { de: { label: "  Firmenname  ", help: "" } },
    choices: [],
    expectedBlockVersion: 2,
    ...overrides,
  };
}

describe("questionnaireSchemas", () => {
  it("trims texts and turns an empty help into null", () => {
    const parsed = questionnaireSchemas.updateField.parse(fieldInput());
    expect(parsed.translations.de).toEqual({ label: "Firmenname", help: null });
  });

  it("accepts a partial set of locales and rejects an unknown one", () => {
    expect(
      questionnaireSchemas.updateField.safeParse(
        fieldInput({ translations: { fr: { label: "Nom" } } }),
      ).success,
    ).toBe(false);
  });

  it("rejects keys that are no snake_case", () => {
    for (const key of ["Company", "1st", "a", "with-dash"])
      expect(
        questionnaireSchemas.createBlock.safeParse({
          key,
          carryOver: false,
          translations: { de: { title: "Titel" } },
        }).success,
      ).toBe(false);
  });

  it("allows single-letter option keys", () => {
    const parsed = questionnaireSchemas.updateField.safeParse(
      fieldInput({ choices: [{ key: "a", labels: { de: "A" } }] }),
    );
    expect(parsed.success).toBe(true);
  });

  it("offers no link as an accepted asset kind", () => {
    expect(
      questionnaireSchemas.updateField.safeParse(
        fieldInput({ acceptedAssetKinds: ["link"] }),
      ).success,
    ).toBe(false);
    expect(
      questionnaireSchemas.updateField.safeParse(
        fieldInput({ acceptedAssetKinds: ["image", "image"] }),
      ).success,
    ).toBe(false);
  });

  it("requires a type and a parent on create, but never on update", () => {
    expect(
      questionnaireSchemas.createField.safeParse(
        fieldInput({ type: QuestionnaireFieldType.Group, parentFieldId: null }),
      ).success,
    ).toBe(true);
    expect(
      questionnaireSchemas.updateField.safeParse(
        fieldInput({ type: QuestionnaireFieldType.Group }),
      ).success,
    ).toBe(false);
  });

  it("moves only by one step", () => {
    for (const direction of [-1, 1])
      expect(
        questionnaireSchemas.moveField.safeParse({
          direction,
          expectedBlockVersion: 1,
        }).success,
      ).toBe(true);
    expect(
      questionnaireSchemas.moveField.safeParse({
        direction: 2,
        expectedBlockVersion: 1,
      }).success,
    ).toBe(false);
  });

  it("rejects a block chosen twice for a template", () => {
    const id = "0b000000-0000-4000-8000-000000000001";
    expect(
      questionnaireSchemas.updateTemplate.safeParse({
        title: "Landingpage kompakt",
        description: null,
        status: "active",
        blockIds: [id, id],
        version: 1,
      }).success,
    ).toBe(false);
  });
});
