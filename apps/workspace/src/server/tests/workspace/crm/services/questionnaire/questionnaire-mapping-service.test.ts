import { describe, expect, it } from "vitest";

import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnairePrefillSource } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import type {
  QuestionnaireBlockRow,
  QuestionnaireDefinitionRows,
  QuestionnaireFieldRow,
  QuestionnaireTemplateRow,
} from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-types";
import { questionnaireMappingService } from "@/server/workspace/crm/services/questionnaire/questionnaire-mapping-service";

const CREATED = new Date("2026-09-01T10:00:00.000Z");
const UPDATED = new Date("2026-09-02T11:00:00.000Z");

function blockRow(
  overrides: Partial<QuestionnaireBlockRow> = {},
): QuestionnaireBlockRow {
  return {
    id: "b-1",
    owner_form_id: null,
    source_block_id: null,
    key: "company_profile",
    carry_over: true,
    status: QuestionnaireCatalogStatus.Active,
    version: 3,
    created_at: CREATED,
    updated_at: UPDATED,
    ...overrides,
  };
}

function fieldRow(
  id: string,
  overrides: Partial<QuestionnaireFieldRow> = {},
): QuestionnaireFieldRow {
  return {
    id,
    block_id: "b-1",
    parent_field_id: null,
    key: id.replace("-", "_"),
    position: 0,
    type: QuestionnaireFieldType.ShortText,
    requirement: QuestionnaireFieldRequirement.Required,
    max_length: null,
    min_items: null,
    max_items: null,
    accepted_asset_kinds: null,
    prefill_source: null,
    condition_field_id: null,
    condition_choice_id: null,
    version: 1,
    created_at: CREATED,
    updated_at: UPDATED,
    ...overrides,
  };
}

function rows(
  overrides: Partial<QuestionnaireDefinitionRows> = {},
): QuestionnaireDefinitionRows {
  return {
    blocks: [blockRow()],
    blockTranslations: [
      {
        block_id: "b-1",
        locale: "de",
        title: "Unternehmen",
        intro: "Stichpunkte reichen.",
      },
      { block_id: "b-1", locale: "en", title: "Company", intro: null },
    ],
    fields: [],
    fieldTranslations: [],
    choices: [],
    choiceTranslations: [],
    ...overrides,
  };
}

describe("questionnaireMappingService.toBlockDtos", () => {
  it("maps a block without fields with its texts per locale", () => {
    expect(questionnaireMappingService.toBlockDtos(rows())).toEqual([
      {
        id: "b-1",
        key: "company_profile",
        carryOver: true,
        status: QuestionnaireCatalogStatus.Active,
        sourceBlockId: null,
        translations: {
          de: { title: "Unternehmen", intro: "Stichpunkte reichen." },
          en: { title: "Company", intro: null },
        },
        fields: [],
        version: 3,
      },
    ]);
  });

  it("maps every field column and nests sub-fields and options by position", () => {
    const [block] = questionnaireMappingService.toBlockDtos(
      rows({
        fields: [
          fieldRow("f-name", {
            parent_field_id: "f-group",
            position: 1,
            max_length: 120,
          }),
          fieldRow("f-group", {
            position: 1,
            type: QuestionnaireFieldType.Group,
            min_items: 1,
            max_items: 10,
          }),
          fieldRow("f-role", { parent_field_id: "f-group", position: 0 }),
          fieldRow("f-show", {
            position: 0,
            type: QuestionnaireFieldType.YesNo,
          }),
          fieldRow("f-company", {
            position: 2,
            prefill_source: QuestionnairePrefillSource.CustomerCompanyName,
            condition_field_id: "f-show",
            condition_choice_id: "c-yes",
          }),
          fieldRow("f-logo", {
            position: 3,
            type: QuestionnaireFieldType.Files,
            accepted_asset_kinds: ["image", "document"],
          }),
        ],
        fieldTranslations: [
          {
            field_id: "f-show",
            locale: "de",
            label: "Team zeigen?",
            help: "Hilfe",
          },
        ],
        choices: [
          {
            id: "c-no",
            field_id: "f-show",
            key: "no",
            position: 1,
            version: 1,
          },
          {
            id: "c-yes",
            field_id: "f-show",
            key: "yes",
            position: 0,
            version: 2,
          },
        ],
        choiceTranslations: [
          { choice_id: "c-yes", locale: "de", label: "Ja" },
          { choice_id: "c-yes", locale: "en", label: "Yes" },
        ],
      }),
    );

    expect(block!.fields.map((field) => field.id)).toEqual([
      "f-show",
      "f-group",
      "f-company",
      "f-logo",
    ]);
    const [show, groupField, company, logo] = block!.fields;
    expect(show!.translations).toEqual({
      de: { label: "Team zeigen?", help: "Hilfe" },
    });
    expect(show!.choices).toEqual([
      {
        id: "c-yes",
        key: "yes",
        position: 0,
        labels: { de: "Ja", en: "Yes" },
        version: 2,
      },
      { id: "c-no", key: "no", position: 1, labels: {}, version: 1 },
    ]);
    expect(groupField!.minItems).toBe(1);
    expect(groupField!.maxItems).toBe(10);
    expect(groupField!.children.map((child) => child.id)).toEqual([
      "f-role",
      "f-name",
    ]);
    expect(groupField!.children[1]).toMatchObject({
      parentFieldId: "f-group",
      maxLength: 120,
      children: [],
    });
    expect(company).toMatchObject({
      prefillSource: QuestionnairePrefillSource.CustomerCompanyName,
      conditionFieldId: "f-show",
      conditionChoiceId: "c-yes",
      translations: {},
      choices: [],
    });
    expect(logo!.acceptedAssetKinds).toEqual(["image", "document"]);
  });

  it("keeps the block order of the rows", () => {
    const dtos = questionnaireMappingService.toBlockDtos(
      rows({ blocks: [blockRow({ id: "b-2", key: "team" }), blockRow()] }),
    );
    expect(dtos.map((dto) => dto.id)).toEqual(["b-2", "b-1"]);
    expect(dtos[0]!.translations).toEqual({});
  });
});

describe("questionnaireMappingService.toBlockSummaryDto", () => {
  it("counts sub-fields, lists titles and the missing locales", () => {
    const [block] = questionnaireMappingService.toBlockDtos(
      rows({
        fields: [
          fieldRow("f-group", { type: QuestionnaireFieldType.Group }),
          fieldRow("f-name", { parent_field_id: "f-group" }),
        ],
        fieldTranslations: [
          { field_id: "f-group", locale: "de", label: "Gruppe", help: null },
          { field_id: "f-name", locale: "de", label: "Name", help: null },
        ],
      }),
    );

    expect(questionnaireMappingService.toBlockSummaryDto(block!, 2)).toEqual({
      id: "b-1",
      key: "company_profile",
      titles: { de: "Unternehmen", en: "Company" },
      carryOver: true,
      status: QuestionnaireCatalogStatus.Active,
      fieldCount: 2,
      missingLocales: ["en"],
      templateCount: 2,
    });
  });
});

describe("questionnaireMappingService template mapping", () => {
  const template: QuestionnaireTemplateRow = {
    id: "t-1",
    title: "Landingpage kompakt",
    description: null,
    status: QuestionnaireCatalogStatus.Archived,
    version: 4,
    created_at: CREATED,
    updated_at: UPDATED,
  };

  it("orders the blocks of a template by position", () => {
    expect(
      questionnaireMappingService.toTemplateDto(template, [
        { block_id: "b-2", position: 1 },
        { block_id: "b-1", position: 0 },
      ]),
    ).toEqual({
      id: "t-1",
      title: "Landingpage kompakt",
      description: null,
      status: QuestionnaireCatalogStatus.Archived,
      blocks: [
        { blockId: "b-1", position: 0 },
        { blockId: "b-2", position: 1 },
      ],
      version: 4,
    });
  });

  it("maps a summary with its block count and change time", () => {
    expect(
      questionnaireMappingService.toTemplateSummaryDto(template, 12),
    ).toEqual({
      id: "t-1",
      title: "Landingpage kompakt",
      description: null,
      status: QuestionnaireCatalogStatus.Archived,
      blockCount: 12,
      updatedAt: "2026-09-02T11:00:00.000Z",
    });
  });
});
