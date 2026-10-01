import { describe, expect, it } from "vitest";
import { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "../../../constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireBlockDto } from "../../../contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "../../../contracts/crm/questionnaire/questionnaire-field.dto";
import { Locale } from "@invessiv/common";
import {
  missingQuestionnaireLocales,
  resolveQuestionnaireText,
} from "./questionnaire-translation";

function field(
  overrides: Partial<QuestionnaireFieldDto> = {},
): QuestionnaireFieldDto {
  return {
    id: "f",
    blockId: "b",
    parentFieldId: null,
    key: "f_key",
    position: 0,
    type: QuestionnaireFieldType.ShortText,
    requirement: QuestionnaireFieldRequirement.Required,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: {
      de: { label: "Firma", help: null },
      en: { label: "Company", help: null },
    },
    choices: [],
    children: [],
    version: 1,
    ...overrides,
  };
}

function block(fields: QuestionnaireFieldDto[]): QuestionnaireBlockDto {
  return {
    id: "b",
    key: "company",
    carryOver: true,
    status: QuestionnaireCatalogStatus.Active,
    sourceBlockId: null,
    translations: {
      de: { title: "Unternehmen", intro: null },
      en: { title: "Company", intro: null },
    },
    fields,
    version: 1,
  };
}

describe("resolveQuestionnaireText", () => {
  it("returns the preferred locale", () => {
    expect(
      resolveQuestionnaireText({ de: "Hallo", en: "Hello" }, Locale.En),
    ).toEqual({ text: "Hello", locale: Locale.En, isFallback: false });
  });

  it("falls back in supported-locale order", () => {
    expect(resolveQuestionnaireText({ de: "Hallo" }, Locale.En)).toEqual({
      text: "Hallo",
      locale: Locale.De,
      isFallback: true,
    });
  });

  it("returns null without any translation", () => {
    expect(resolveQuestionnaireText({}, Locale.De)).toBeNull();
  });
});

describe("missingQuestionnaireLocales", () => {
  it("is empty for a fully translated block", () => {
    expect(missingQuestionnaireLocales(block([field()]))).toEqual([]);
  });

  it("finds a locale missing on a choice of a sub-field", () => {
    const child = field({
      id: "c",
      parentFieldId: "g",
      type: QuestionnaireFieldType.Choice,
      choices: [
        { id: "o", key: "a", position: 0, labels: { de: "A" }, version: 1 },
      ],
    });
    const group = field({
      id: "g",
      type: QuestionnaireFieldType.Group,
      children: [child],
    });
    expect(missingQuestionnaireLocales(block([group]))).toEqual([Locale.En]);
  });

  it("finds a locale missing on the block itself", () => {
    const partial = block([field()]);
    partial.translations = { en: { title: "Company", intro: null } };
    expect(missingQuestionnaireLocales(partial)).toEqual([Locale.De]);
  });
});
