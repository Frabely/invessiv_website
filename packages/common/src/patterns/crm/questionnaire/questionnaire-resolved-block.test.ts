import { describe, expect, it } from "vitest";
import { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "../../../constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireBlockDto } from "../../../contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "../../../contracts/crm/questionnaire/questionnaire-field.dto";
import { Locale } from "../../../contracts/i18n/locale";
import { resolveQuestionnaireBlock } from "./questionnaire-resolved-block";

function field(
  key: string,
  overrides: Partial<QuestionnaireFieldDto> = {},
): QuestionnaireFieldDto {
  return {
    id: `f-${key}`,
    blockId: "block-1",
    parentFieldId: null,
    key,
    position: 0,
    type: QuestionnaireFieldType.ShortText,
    requirement: QuestionnaireFieldRequirement.Optional,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: {
      de: { label: `DE ${key}`, help: "Hilfe" },
      en: { label: `EN ${key}`, help: null },
    },
    choices: [],
    children: [],
    version: 1,
    ...overrides,
  };
}

function block(
  fields: QuestionnaireFieldDto[],
  overrides: Partial<QuestionnaireBlockDto> = {},
): QuestionnaireBlockDto {
  return {
    id: "block-1",
    key: "company_profile",
    carryOver: false,
    status: QuestionnaireCatalogStatus.Active,
    sourceBlockId: null,
    translations: {
      de: { title: "Unternehmen", intro: "Kurz zu euch" },
      en: { title: "Company", intro: null },
    },
    fields,
    version: 1,
    ...overrides,
  };
}

describe("resolveQuestionnaireBlock", () => {
  it("resolves block, field and option texts in the requested locale", () => {
    const pick = field("pick", {
      type: QuestionnaireFieldType.Choice,
      choices: [
        {
          id: "c-a",
          key: "a",
          position: 0,
          labels: { de: "Ja", en: "Yes" },
          version: 1,
        },
      ],
    });

    expect(resolveQuestionnaireBlock(block([pick]), Locale.En)).toEqual({
      id: "block-1",
      title: "Company",
      intro: null,
      fallbackLocale: null,
      fields: [
        {
          id: "f-pick",
          blockId: "block-1",
          parentFieldId: null,
          position: 0,
          type: QuestionnaireFieldType.Choice,
          requirement: QuestionnaireFieldRequirement.Optional,
          maxLength: null,
          minItems: null,
          maxItems: null,
          acceptedAssetKinds: null,
          conditionFieldId: null,
          conditionChoiceId: null,
          label: "EN pick",
          help: null,
          choices: [{ id: "c-a", position: 0, label: "Yes" }],
          children: [],
        },
      ],
    });
  });

  it("falls back to a maintained locale and names it", () => {
    const germanOnly = block(
      [field("name", { translations: { de: { label: "Name", help: null } } })],
      { translations: { de: { title: "Unternehmen", intro: null } } },
    );

    expect(resolveQuestionnaireBlock(germanOnly, Locale.En)).toMatchObject({
      title: "Unternehmen",
      fallbackLocale: Locale.De,
      fields: [{ label: "Name" }],
    });
  });

  it.each([
    [
      "a field",
      block([
        field("name", { translations: { de: { label: "Name", help: null } } }),
      ]),
    ],
    [
      "an option",
      block([
        field("pick", {
          choices: [
            {
              id: "c",
              key: "a",
              position: 0,
              labels: { de: "Ja" },
              version: 1,
            },
          ],
        }),
      ]),
    ],
    [
      "a sub-field",
      block([
        field("team", {
          type: QuestionnaireFieldType.Group,
          children: [
            field("member", {
              parentFieldId: "f-team",
              translations: { de: { label: "Mitglied", help: null } },
            }),
          ],
        }),
      ]),
    ],
  ])("names the fallback when only %s lacks the locale", (_name, input) => {
    expect(resolveQuestionnaireBlock(input, Locale.En)).toMatchObject({
      title: "Company",
      fallbackLocale: Locale.De,
    });
  });

  it("keeps sub-fields and drops keys, versions, sources and other locales", () => {
    const group = field("team", {
      type: QuestionnaireFieldType.Group,
      children: [field("member", { parentFieldId: "f-team" })],
    });

    const resolved = resolveQuestionnaireBlock(block([group]), Locale.De);

    const [team] = resolved.fields;
    expect(team.children).toMatchObject([
      { id: "f-member", parentFieldId: "f-team", label: "DE member" },
    ]);
    for (const mapped of [resolved, team, team.children[0]]) {
      expect(mapped).not.toHaveProperty("key");
      expect(mapped).not.toHaveProperty("version");
      expect(mapped).not.toHaveProperty("prefillSource");
      expect(mapped).not.toHaveProperty("translations");
    }
  });
});
