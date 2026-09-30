import { describe, expect, it } from "vitest";
import { OnboardingCatalogStatus } from "../../../constants/crm/onboarding/onboarding-catalog-statuses";
import { ONBOARDING_CONFIRMED_VALUE } from "../../../constants/crm/onboarding/onboarding-confirmed-value";
import { OnboardingFieldRequirement } from "../../../constants/crm/onboarding/onboarding-field-requirements";
import {
  ONBOARDING_FIELD_TYPE_VALUES,
  OnboardingFieldType,
} from "../../../constants/crm/onboarding/onboarding-field-types";
import type { OnboardingAnswerDto } from "../../../contracts/crm/onboarding/onboarding-answer.dto";
import type { OnboardingBlockDto } from "../../../contracts/crm/onboarding/onboarding-block.dto";
import type { OnboardingCompletenessInput } from "../../../contracts/crm/onboarding/onboarding-completeness-input";
import type { OnboardingFieldDto } from "../../../contracts/crm/onboarding/onboarding-field.dto";
import {
  getOnboardingCompleteness,
  isOnboardingFieldVisible,
} from "./onboarding-completeness";

const BLOCK_ID = "block-1";

function field(
  id: string,
  type: OnboardingFieldDto["type"],
  overrides: Partial<OnboardingFieldDto> = {},
): OnboardingFieldDto {
  return {
    id,
    blockId: BLOCK_ID,
    parentFieldId: null,
    key: id.replace(/-/g, "_"),
    position: 0,
    type,
    requirement: OnboardingFieldRequirement.Required,
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
  fields: OnboardingFieldDto[],
  id = BLOCK_ID,
): OnboardingBlockDto {
  return {
    id,
    key: id.replace(/-/g, "_"),
    carryOver: false,
    status: OnboardingCatalogStatus.Active,
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
): OnboardingAnswerDto {
  return { fieldId, groupEntryId, sortOrder: 0, value: text, choiceId: null };
}

function choice(
  fieldId: string,
  choiceId: string,
  groupEntryId: string | null = null,
  sortOrder = 0,
): OnboardingAnswerDto {
  return { fieldId, groupEntryId, sortOrder, value: null, choiceId };
}

function input(
  overrides: Partial<OnboardingCompletenessInput> = {},
): OnboardingCompletenessInput {
  return {
    blocks: [],
    answers: [],
    answerFiles: [],
    groupEntries: [],
    servicesConfirmed: false,
    ...overrides,
  };
}

const optional = { requirement: OnboardingFieldRequirement.Optional };

describe("getOnboardingCompleteness totals", () => {
  it("reports 0 for an unanswered form, never NaN", () => {
    const result = getOnboardingCompleteness(
      input({
        blocks: [block([field("name", OnboardingFieldType.ShortText)])],
      }),
    );
    expect(result.ratio).toBe(0);
    expect(result.totalRequired).toBe(1);
    expect(result.missing).toEqual([
      { blockId: BLOCK_ID, fieldId: "name", groupEntryId: null },
    ]);
  });

  it("reports 1 when nothing is required", () => {
    expect(getOnboardingCompleteness(input()).ratio).toBe(1);
    const result = getOnboardingCompleteness(
      input({
        blocks: [
          block([field("name", OnboardingFieldType.ShortText, optional)]),
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
    const result = getOnboardingCompleteness(
      input({
        blocks: [
          block(
            [
              field("a", OnboardingFieldType.ShortText),
              field("b", OnboardingFieldType.ShortText),
            ],
            "block-2",
          ),
          block([field("c", OnboardingFieldType.ShortText)], "block-1"),
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
      field("first", OnboardingFieldType.ShortText),
      field("second", OnboardingFieldType.ShortText),
    ]);
    unordered.fields = [...unordered.fields].reverse();
    const result = getOnboardingCompleteness(input({ blocks: [unordered] }));
    expect(result.missing.map((entry) => entry.fieldId)).toEqual([
      "first",
      "second",
    ]);
  });
});

describe("getOnboardingCompleteness per field type", () => {
  const answered: [
    OnboardingFieldDto["type"],
    Partial<OnboardingCompletenessInput>,
  ][] = [
    [OnboardingFieldType.ShortText, { answers: [value("f", "x")] }],
    [OnboardingFieldType.LongText, { answers: [value("f", "x")] }],
    [OnboardingFieldType.Email, { answers: [value("f", "a@b.de")] }],
    [OnboardingFieldType.Phone, { answers: [value("f", "+49 30 123456")] }],
    [OnboardingFieldType.Url, { answers: [value("f", "https://a.de")] }],
    [OnboardingFieldType.Color, { answers: [value("f", "#aabbcc")] }],
    [OnboardingFieldType.Scale, { answers: [value("f", "3")] }],
    [OnboardingFieldType.Choice, { answers: [choice("f", "c1")] }],
    [OnboardingFieldType.MultiChoice, { answers: [choice("f", "c1")] }],
    [OnboardingFieldType.YesNo, { answers: [choice("f", "yes")] }],
    [
      OnboardingFieldType.Confirmation,
      { answers: [value("f", ONBOARDING_CONFIRMED_VALUE)] },
    ],
    [
      OnboardingFieldType.Files,
      { answerFiles: [{ fieldId: "f", groupEntryId: null }] },
    ],
    [
      OnboardingFieldType.Group,
      { groupEntries: [{ id: "e1", fieldId: "f", position: 0 }] },
    ],
    [OnboardingFieldType.ProjectServices, { servicesConfirmed: true }],
  ];

  it("covers every field type", () => {
    expect(answered.map(([type]) => type).sort()).toEqual(
      [...ONBOARDING_FIELD_TYPE_VALUES].sort(),
    );
  });

  it.each(answered)(
    "counts a required %s as missing without an answer",
    (type) => {
      const result = getOnboardingCompleteness(
        input({ blocks: [block([field("f", type)])] }),
      );
      expect(result.missing).toHaveLength(1);
      expect(result.answeredRequired).toBe(0);
    },
  );

  it.each(answered)("counts a required %s as answered", (type, answers) => {
    const result = getOnboardingCompleteness(
      input({ blocks: [block([field("f", type)])], ...answers }),
    );
    expect(result.missing).toEqual([]);
    expect(result.answeredRequired).toBe(1);
  });

  it("answers a confirmation only with the confirmed value", () => {
    const result = getOnboardingCompleteness(
      input({
        blocks: [block([field("f", OnboardingFieldType.Confirmation)])],
        answers: [value("f", "false")],
      }),
    );
    expect(result.missing).toHaveLength(1);
  });

  it("requires project services to be confirmed", () => {
    const blocks = [block([field("f", OnboardingFieldType.ProjectServices)])];
    expect(getOnboardingCompleteness(input({ blocks })).missing).toHaveLength(
      1,
    );
    expect(
      getOnboardingCompleteness(input({ blocks, servicesConfirmed: true }))
        .missing,
    ).toEqual([]);
  });

  it("ignores answers of another group entry or field", () => {
    const result = getOnboardingCompleteness(
      input({
        blocks: [block([field("f", OnboardingFieldType.ShortText)])],
        answers: [value("f", "x", "entry"), value("other", "x")],
      }),
    );
    expect(result.missing).toHaveLength(1);
  });
});

describe("getOnboardingCompleteness item counts", () => {
  it("needs min_items entries on a required multi choice", () => {
    const blocks = [
      block([field("f", OnboardingFieldType.MultiChoice, { minItems: 2 })]),
    ];
    expect(
      getOnboardingCompleteness(input({ blocks, answers: [choice("f", "a")] }))
        .missing,
    ).toHaveLength(1);
    expect(
      getOnboardingCompleteness(
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
        field("f", OnboardingFieldType.Files, { ...optional, minItems: 2 }),
      ]),
    ];
    const empty = getOnboardingCompleteness(input({ blocks }));
    expect(empty.missing).toEqual([]);
    expect(empty.totalRequired).toBe(0);
    const partial = getOnboardingCompleteness(
      input({ blocks, answerFiles: [{ fieldId: "f", groupEntryId: null }] }),
    );
    expect(partial.missing).toEqual([
      { blockId: BLOCK_ID, fieldId: "f", groupEntryId: null },
    ]);
    expect(partial.ratio).toBeLessThan(1);
  });
});

describe("getOnboardingCompleteness conditions", () => {
  const trigger = field("has_shop", OnboardingFieldType.YesNo, optional);
  const dependent = field("shop_url", OnboardingFieldType.Url, {
    conditionFieldId: "has_shop",
    conditionChoiceId: "yes",
  });

  it("does not require a field behind an unmet condition", () => {
    const result = getOnboardingCompleteness(
      input({ blocks: [block([trigger, dependent])] }),
    );
    expect(result.missing).toEqual([]);
    expect(result.totalRequired).toBe(0);
  });

  it("requires the field once the condition is met", () => {
    const result = getOnboardingCompleteness(
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
    const result = getOnboardingCompleteness(
      input({
        blocks: [block([trigger, dependent])],
        answers: [choice("has_shop", "no")],
      }),
    );
    expect(result.missing).toEqual([]);
  });

  it("hides a field whose trigger is itself hidden", () => {
    const second = field("shop_system", OnboardingFieldType.Choice, {
      ...optional,
      conditionFieldId: "has_shop",
      conditionChoiceId: "yes",
    });
    const third = field("plugin_list", OnboardingFieldType.LongText, {
      conditionFieldId: "shop_system",
      conditionChoiceId: "shopify",
    });
    const blocks = [block([trigger, second, third])];
    const stale = getOnboardingCompleteness(
      input({
        blocks,
        answers: [choice("has_shop", "no"), choice("shop_system", "shopify")],
      }),
    );
    expect(stale.missing).toEqual([]);
    const shown = getOnboardingCompleteness(
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
    const orphan = field("orphan", OnboardingFieldType.ShortText, {
      conditionFieldId: "missing",
      conditionChoiceId: "yes",
    });
    const result = getOnboardingCompleteness(
      input({ blocks: [block([orphan])] }),
    );
    expect(result.missing).toEqual([]);
  });

  it("does not loop on a circular condition", () => {
    const a = field("a", OnboardingFieldType.YesNo, {
      conditionFieldId: "b",
      conditionChoiceId: "yes",
    });
    const b = field("b", OnboardingFieldType.YesNo, {
      conditionFieldId: "a",
      conditionChoiceId: "yes",
    });
    const result = getOnboardingCompleteness(
      input({
        blocks: [block([a, b])],
        answers: [choice("a", "yes"), choice("b", "yes")],
      }),
    );
    expect(result.totalRequired).toBe(0);
  });
});

describe("getOnboardingCompleteness groups", () => {
  function teamGroup(overrides: Partial<OnboardingFieldDto> = {}) {
    return field("team", OnboardingFieldType.Group, {
      minItems: 2,
      ...overrides,
      children: [
        field("member_name", OnboardingFieldType.ShortText, {
          parentFieldId: "team",
          position: 0,
        }),
        field("has_photo", OnboardingFieldType.YesNo, {
          ...optional,
          parentFieldId: "team",
          position: 1,
        }),
        field("photo", OnboardingFieldType.Files, {
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
    const result = getOnboardingCompleteness(
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
    const result = getOnboardingCompleteness(
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
    const result = getOnboardingCompleteness(
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
    const trigger = field("has_team", OnboardingFieldType.YesNo, optional);
    const group = teamGroup({
      conditionFieldId: "has_team",
      conditionChoiceId: "yes",
    });
    const result = getOnboardingCompleteness(
      input({
        blocks: [block([trigger, group])],
        groupEntries: entries,
      }),
    );
    expect(result.totalRequired).toBe(0);
  });

  it("allows an optional group without entries", () => {
    const result = getOnboardingCompleteness(
      input({ blocks: [block([teamGroup(optional)])] }),
    );
    expect(result.missing).toEqual([]);
  });
});

describe("isOnboardingFieldVisible", () => {
  it("shows a field without condition", () => {
    const f = field("f", OnboardingFieldType.ShortText);
    expect(isOnboardingFieldVisible(f, input({ blocks: [block([f])] }))).toBe(
      true,
    );
  });

  it("evaluates a sub-field for the given group entry", () => {
    const group = field("g", OnboardingFieldType.Group, {
      children: [
        field("t", OnboardingFieldType.YesNo, { parentFieldId: "g" }),
        field("d", OnboardingFieldType.ShortText, {
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
    expect(isOnboardingFieldVisible(dependent, state, "e1")).toBe(true);
    expect(isOnboardingFieldVisible(dependent, state, "e2")).toBe(false);
  });
});
