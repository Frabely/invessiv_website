import { describe, expect, it } from "vitest";
import { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QUESTIONNAIRE_CONFIRMED_VALUE } from "../../../constants/crm/questionnaire/questionnaire-confirmed-value";
import { QuestionnaireFieldRequirement } from "../../../constants/crm/questionnaire/questionnaire-field-requirements";
import {
  QUESTIONNAIRE_FIELD_TYPE_VALUES,
  QuestionnaireFieldType,
} from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireAnswerDto } from "../../../contracts/crm/questionnaire/questionnaire-answer.dto";
import type { QuestionnaireBlockDto } from "../../../contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireCompletenessInput } from "../../../contracts/crm/questionnaire/questionnaire-completeness-input";
import type { QuestionnaireFieldDto } from "../../../contracts/crm/questionnaire/questionnaire-field.dto";
import {
  getQuestionnaireCompleteness,
  isQuestionnaireFieldVisible,
} from "./questionnaire-completeness";

const BLOCK_ID = "block-1";

function field(
  id: string,
  type: QuestionnaireFieldDto["type"],
  overrides: Partial<QuestionnaireFieldDto> = {},
): QuestionnaireFieldDto {
  return {
    id,
    blockId: BLOCK_ID,
    parentFieldId: null,
    key: id.replace(/-/g, "_"),
    position: 0,
    type,
    requirement: QuestionnaireFieldRequirement.Required,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: { de: { label: id, help: null } },
    choices: [],
    children: [],
    version: 1,
    ...overrides,
  };
}

function block(
  fields: QuestionnaireFieldDto[],
  id = BLOCK_ID,
): QuestionnaireBlockDto {
  return {
    id,
    key: id.replace(/-/g, "_"),
    carryOver: false,
    status: QuestionnaireCatalogStatus.Active,
    sourceBlockId: null,
    translations: { de: { title: id, intro: null } },
    fields: fields.map((entry, position) => ({
      ...entry,
      blockId: id,
      position,
    })),
    version: 1,
  };
}

function value(
  fieldId: string,
  text: string,
  groupEntryId: string | null = null,
): QuestionnaireAnswerDto {
  return { fieldId, groupEntryId, sortOrder: 0, value: text, choiceId: null };
}

function choice(
  fieldId: string,
  choiceId: string,
  groupEntryId: string | null = null,
  sortOrder = 0,
): QuestionnaireAnswerDto {
  return { fieldId, groupEntryId, sortOrder, value: null, choiceId };
}

function input(
  overrides: Partial<QuestionnaireCompletenessInput> = {},
): QuestionnaireCompletenessInput {
  return {
    blocks: [],
    answers: [],
    answerFiles: [],
    groupEntries: [],
    servicesConfirmed: false,
    ...overrides,
  };
}

const optional = { requirement: QuestionnaireFieldRequirement.Optional };

describe("getQuestionnaireCompleteness totals", () => {
  it("reports 0 for an unanswered form, never NaN", () => {
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([field("name", QuestionnaireFieldType.ShortText)])],
      }),
    );
    expect(result.ratio).toBe(0);
    expect(result.totalRequired).toBe(1);
    expect(result.missing).toEqual([
      { blockId: BLOCK_ID, fieldId: "name", groupEntryId: null },
    ]);
  });

  it("reports 1 when nothing is required", () => {
    expect(getQuestionnaireCompleteness(input()).ratio).toBe(1);
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [
          block([field("name", QuestionnaireFieldType.ShortText, optional)]),
        ],
      }),
    );
    expect(result).toMatchObject({
      ratio: 1,
      totalRequired: 0,
      answeredRequired: 0,
      missing: [],
    });
  });

  it("reports progress per block in form order", () => {
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [
          block(
            [
              field("a", QuestionnaireFieldType.ShortText),
              field("b", QuestionnaireFieldType.ShortText),
            ],
            "block-2",
          ),
          block([field("c", QuestionnaireFieldType.ShortText)], "block-1"),
        ],
        answers: [value("a", "Anna")],
      }),
    );
    expect(result.blocks).toEqual([
      { blockId: "block-2", answeredRequired: 1, totalRequired: 2 },
      { blockId: "block-1", answeredRequired: 0, totalRequired: 1 },
    ]);
    expect(result.ratio).toBeCloseTo(1 / 3);
  });

  it("orders missing fields by position, not by input order", () => {
    const unordered = block([
      field("first", QuestionnaireFieldType.ShortText),
      field("second", QuestionnaireFieldType.ShortText),
    ]);
    unordered.fields = [...unordered.fields].reverse();
    const result = getQuestionnaireCompleteness(input({ blocks: [unordered] }));
    expect(result.missing.map((entry) => entry.fieldId)).toEqual([
      "first",
      "second",
    ]);
  });
});

describe("getQuestionnaireCompleteness per field type", () => {
  const answered: [
    QuestionnaireFieldDto["type"],
    Partial<QuestionnaireCompletenessInput>,
  ][] = [
    [QuestionnaireFieldType.ShortText, { answers: [value("f", "x")] }],
    [QuestionnaireFieldType.LongText, { answers: [value("f", "x")] }],
    [QuestionnaireFieldType.Email, { answers: [value("f", "a@b.de")] }],
    [QuestionnaireFieldType.Phone, { answers: [value("f", "+49 30 123456")] }],
    [QuestionnaireFieldType.Url, { answers: [value("f", "https://a.de")] }],
    [QuestionnaireFieldType.Color, { answers: [value("f", "#aabbcc")] }],
    [QuestionnaireFieldType.Scale, { answers: [value("f", "3")] }],
    [QuestionnaireFieldType.Choice, { answers: [choice("f", "c1")] }],
    [QuestionnaireFieldType.MultiChoice, { answers: [choice("f", "c1")] }],
    [QuestionnaireFieldType.YesNo, { answers: [choice("f", "yes")] }],
    [
      QuestionnaireFieldType.Confirmation,
      { answers: [value("f", QUESTIONNAIRE_CONFIRMED_VALUE)] },
    ],
    [
      QuestionnaireFieldType.Files,
      { answerFiles: [{ fieldId: "f", groupEntryId: null }] },
    ],
    [
      QuestionnaireFieldType.Group,
      { groupEntries: [{ id: "e1", fieldId: "f", position: 0 }] },
    ],
    [QuestionnaireFieldType.ProjectServices, { servicesConfirmed: true }],
  ];

  it("covers every field type", () => {
    expect(answered.map(([type]) => type).sort()).toEqual(
      [...QUESTIONNAIRE_FIELD_TYPE_VALUES].sort(),
    );
  });

  it.each(answered)(
    "counts a required %s as missing without an answer",
    (type) => {
      const result = getQuestionnaireCompleteness(
        input({ blocks: [block([field("f", type)])] }),
      );
      expect(result.missing).toHaveLength(1);
      expect(result.answeredRequired).toBe(0);
    },
  );

  it.each(answered)("counts a required %s as answered", (type, answers) => {
    const result = getQuestionnaireCompleteness(
      input({ blocks: [block([field("f", type)])], ...answers }),
    );
    expect(result.missing).toEqual([]);
    expect(result.answeredRequired).toBe(1);
  });

  it("answers a confirmation only with the confirmed value", () => {
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([field("f", QuestionnaireFieldType.Confirmation)])],
        answers: [value("f", "false")],
      }),
    );
    expect(result.missing).toHaveLength(1);
  });

  it("requires project services to be confirmed", () => {
    const blocks = [
      block([field("f", QuestionnaireFieldType.ProjectServices)]),
    ];
    expect(
      getQuestionnaireCompleteness(input({ blocks })).missing,
    ).toHaveLength(1);
    expect(
      getQuestionnaireCompleteness(input({ blocks, servicesConfirmed: true }))
        .missing,
    ).toEqual([]);
  });

  it("ignores answers of another group entry or field", () => {
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([field("f", QuestionnaireFieldType.ShortText)])],
        answers: [value("f", "x", "entry"), value("other", "x")],
      }),
    );
    expect(result.missing).toHaveLength(1);
  });
});

describe("getQuestionnaireCompleteness item counts", () => {
  it("needs min_items entries on a required multi choice", () => {
    const blocks = [
      block([field("f", QuestionnaireFieldType.MultiChoice, { minItems: 2 })]),
    ];
    expect(
      getQuestionnaireCompleteness(
        input({ blocks, answers: [choice("f", "a")] }),
      ).missing,
    ).toHaveLength(1);
    expect(
      getQuestionnaireCompleteness(
        input({
          blocks,
          answers: [choice("f", "a"), choice("f", "b", null, 1)],
        }),
      ).missing,
    ).toEqual([]);
  });

  it("applies min_items to an optional field once it has an entry", () => {
    const blocks = [
      block([
        field("f", QuestionnaireFieldType.Files, { ...optional, minItems: 2 }),
      ]),
    ];
    const empty = getQuestionnaireCompleteness(input({ blocks }));
    expect(empty.missing).toEqual([]);
    expect(empty.totalRequired).toBe(0);
    const partial = getQuestionnaireCompleteness(
      input({ blocks, answerFiles: [{ fieldId: "f", groupEntryId: null }] }),
    );
    expect(partial.missing).toEqual([
      { blockId: BLOCK_ID, fieldId: "f", groupEntryId: null },
    ]);
    expect(partial.ratio).toBeLessThan(1);
  });
});

describe("getQuestionnaireCompleteness conditions", () => {
  const trigger = field("has_shop", QuestionnaireFieldType.YesNo, optional);
  const dependent = field("shop_url", QuestionnaireFieldType.Url, {
    conditionFieldId: "has_shop",
    conditionChoiceId: "yes",
  });

  it("does not require a field behind an unmet condition", () => {
    const result = getQuestionnaireCompleteness(
      input({ blocks: [block([trigger, dependent])] }),
    );
    expect(result.missing).toEqual([]);
    expect(result.totalRequired).toBe(0);
  });

  it("requires the field once the condition is met", () => {
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([trigger, dependent])],
        answers: [choice("has_shop", "yes")],
      }),
    );
    expect(result.missing).toEqual([
      { blockId: BLOCK_ID, fieldId: "shop_url", groupEntryId: null },
    ]);
  });

  it("keeps the field hidden for another option", () => {
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([trigger, dependent])],
        answers: [choice("has_shop", "no")],
      }),
    );
    expect(result.missing).toEqual([]);
  });

  it("hides a field whose trigger is itself hidden", () => {
    const second = field("shop_system", QuestionnaireFieldType.Choice, {
      ...optional,
      conditionFieldId: "has_shop",
      conditionChoiceId: "yes",
    });
    const third = field("plugin_list", QuestionnaireFieldType.LongText, {
      conditionFieldId: "shop_system",
      conditionChoiceId: "shopify",
    });
    const blocks = [block([trigger, second, third])];
    const stale = getQuestionnaireCompleteness(
      input({
        blocks,
        answers: [choice("has_shop", "no"), choice("shop_system", "shopify")],
      }),
    );
    expect(stale.missing).toEqual([]);
    const shown = getQuestionnaireCompleteness(
      input({
        blocks,
        answers: [choice("has_shop", "yes"), choice("shop_system", "shopify")],
      }),
    );
    expect(shown.missing.map((entry) => entry.fieldId)).toEqual([
      "plugin_list",
    ]);
  });

  it("treats a condition on an unknown trigger as unmet", () => {
    const orphan = field("orphan", QuestionnaireFieldType.ShortText, {
      conditionFieldId: "missing",
      conditionChoiceId: "yes",
    });
    const result = getQuestionnaireCompleteness(
      input({ blocks: [block([orphan])] }),
    );
    expect(result.missing).toEqual([]);
  });

  it("does not loop on a circular condition", () => {
    const a = field("a", QuestionnaireFieldType.YesNo, {
      conditionFieldId: "b",
      conditionChoiceId: "yes",
    });
    const b = field("b", QuestionnaireFieldType.YesNo, {
      conditionFieldId: "a",
      conditionChoiceId: "yes",
    });
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([a, b])],
        answers: [choice("a", "yes"), choice("b", "yes")],
      }),
    );
    expect(result.totalRequired).toBe(0);
  });
});

describe("getQuestionnaireCompleteness groups", () => {
  function teamGroup(overrides: Partial<QuestionnaireFieldDto> = {}) {
    return field("team", QuestionnaireFieldType.Group, {
      minItems: 2,
      ...overrides,
      children: [
        field("member_name", QuestionnaireFieldType.ShortText, {
          parentFieldId: "team",
          position: 0,
        }),
        field("has_photo", QuestionnaireFieldType.YesNo, {
          ...optional,
          parentFieldId: "team",
          position: 1,
        }),
        field("photo", QuestionnaireFieldType.Files, {
          parentFieldId: "team",
          position: 2,
          conditionFieldId: "has_photo",
          conditionChoiceId: "yes",
        }),
      ],
    });
  }
  const entries = [
    { id: "e2", fieldId: "team", position: 1 },
    { id: "e1", fieldId: "team", position: 0 },
  ];

  it("misses a group with fewer entries than min_items", () => {
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([teamGroup()])],
        groupEntries: [entries[1]!],
        answers: [value("member_name", "Anna", "e1")],
      }),
    );
    expect(result.missing).toEqual([
      { blockId: BLOCK_ID, fieldId: "team", groupEntryId: null },
    ]);
  });

  it("misses an empty required sub-field per entry", () => {
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([teamGroup()])],
        groupEntries: entries,
        answers: [value("member_name", "Anna", "e1")],
      }),
    );
    expect(result.missing).toEqual([
      { blockId: BLOCK_ID, fieldId: "member_name", groupEntryId: "e2" },
    ]);
    expect(result.totalRequired).toBe(3);
    expect(result.answeredRequired).toBe(2);
  });

  it("evaluates a sub-field condition per entry", () => {
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([teamGroup()])],
        groupEntries: entries,
        answers: [
          value("member_name", "Anna", "e1"),
          value("member_name", "Ben", "e2"),
          choice("has_photo", "yes", "e2"),
          choice("has_photo", "no", "e1"),
        ],
      }),
    );
    expect(result.missing).toEqual([
      { blockId: BLOCK_ID, fieldId: "photo", groupEntryId: "e2" },
    ]);
  });

  it("does not count sub-fields of a hidden group", () => {
    const trigger = field("has_team", QuestionnaireFieldType.YesNo, optional);
    const group = teamGroup({
      conditionFieldId: "has_team",
      conditionChoiceId: "yes",
    });
    const result = getQuestionnaireCompleteness(
      input({
        blocks: [block([trigger, group])],
        groupEntries: entries,
      }),
    );
    expect(result.totalRequired).toBe(0);
  });

  it("allows an optional group without entries", () => {
    const result = getQuestionnaireCompleteness(
      input({ blocks: [block([teamGroup(optional)])] }),
    );
    expect(result.missing).toEqual([]);
  });
});

describe("isQuestionnaireFieldVisible", () => {
  it("shows a field without condition", () => {
    const f = field("f", QuestionnaireFieldType.ShortText);
    expect(
      isQuestionnaireFieldVisible(f, input({ blocks: [block([f])] })),
    ).toBe(true);
  });

  it("evaluates a sub-field for the given group entry", () => {
    const group = field("g", QuestionnaireFieldType.Group, {
      children: [
        field("t", QuestionnaireFieldType.YesNo, { parentFieldId: "g" }),
        field("d", QuestionnaireFieldType.ShortText, {
          parentFieldId: "g",
          position: 1,
          conditionFieldId: "t",
          conditionChoiceId: "yes",
        }),
      ],
    });
    const state = input({
      blocks: [block([group])],
      groupEntries: [
        { id: "e1", fieldId: "g", position: 0 },
        { id: "e2", fieldId: "g", position: 1 },
      ],
      answers: [choice("t", "yes", "e1")],
    });
    const dependent = group.children[1]!;
    expect(isQuestionnaireFieldVisible(dependent, state, "e1")).toBe(true);
    expect(isQuestionnaireFieldVisible(dependent, state, "e2")).toBe(false);
  });
});
