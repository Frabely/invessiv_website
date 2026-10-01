import { describe, expect, it } from "vitest";
import { ASSET_KIND_VALUES, AssetKind } from "../../files/asset-kind";
import { QUESTIONNAIRE_ACCEPTED_ASSET_KIND_VALUES } from "./questionnaire-accepted-asset-kinds";
import {
  QUESTIONNAIRE_CATALOG_STATUS_VALUES,
  QuestionnaireCatalogStatus,
} from "./questionnaire-catalog-statuses";
import {
  QUESTIONNAIRE_FIELD_REQUIREMENT_VALUES,
  QuestionnaireFieldRequirement,
} from "./questionnaire-field-requirements";
import {
  QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES,
  QUESTIONNAIRE_CHOICE_FIELD_TYPE_VALUES,
  QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES,
  QUESTIONNAIRE_FIELD_TYPE_VALUES,
  QUESTIONNAIRE_GROUP_CHILD_EXCLUDED_TYPE_VALUES,
  QUESTIONNAIRE_ITEM_COUNT_FIELD_TYPE_VALUES,
  QUESTIONNAIRE_LENGTH_LIMITED_FIELD_TYPE_VALUES,
  QUESTIONNAIRE_NON_ANSWER_ROW_TYPE_VALUES,
  QUESTIONNAIRE_TEXT_FIELD_TYPE_VALUES,
  QuestionnaireFieldType,
} from "./questionnaire-field-types";
import {
  QUESTIONNAIRE_KEY_PATTERN_SOURCE,
  QUESTIONNAIRE_CHOICE_KEY_PATTERN_SOURCE,
} from "./questionnaire-key-patterns";
import { QUESTIONNAIRE_LIMITS } from "./questionnaire-limits";
import {
  QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES,
  QUESTIONNAIRE_PREFILL_SOURCE_VALUES,
  QuestionnairePrefillSource,
} from "./questionnaire-prefill-sources";
import {
  QUESTIONNAIRE_SCALE_CHOICE_KEY_VALUES,
  QuestionnaireScaleChoiceKey,
} from "./questionnaire-scale-choice-keys";
import {
  QUESTIONNAIRE_VALUE_ERROR_CODE_VALUES,
  QuestionnaireValueErrorCode,
} from "./questionnaire-value-error-codes";
import {
  QUESTIONNAIRE_YES_NO_CHOICE_KEY_VALUES,
  QuestionnaireYesNoChoiceKey,
} from "./questionnaire-yes-no-choice-keys";

describe("questionnaire const objects", () => {
  it.each([
    [QuestionnaireFieldType, QUESTIONNAIRE_FIELD_TYPE_VALUES],
    [QuestionnaireFieldRequirement, QUESTIONNAIRE_FIELD_REQUIREMENT_VALUES],
    [QuestionnaireCatalogStatus, QUESTIONNAIRE_CATALOG_STATUS_VALUES],
    [QuestionnairePrefillSource, QUESTIONNAIRE_PREFILL_SOURCE_VALUES],
    [QuestionnaireYesNoChoiceKey, QUESTIONNAIRE_YES_NO_CHOICE_KEY_VALUES],
    [QuestionnaireScaleChoiceKey, QUESTIONNAIRE_SCALE_CHOICE_KEY_VALUES],
    [QuestionnaireValueErrorCode, QUESTIONNAIRE_VALUE_ERROR_CODE_VALUES],
  ] as const)("lists every value exactly once", (constObject, values) => {
    expect([...values]).toEqual(Object.values(constObject));
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("questionnaire field type groups", () => {
  it.each(
    [
      QUESTIONNAIRE_CHOICE_FIELD_TYPE_VALUES,
      QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES,
      QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES,
      QUESTIONNAIRE_TEXT_FIELD_TYPE_VALUES,
      QUESTIONNAIRE_LENGTH_LIMITED_FIELD_TYPE_VALUES,
      QUESTIONNAIRE_ITEM_COUNT_FIELD_TYPE_VALUES,
      QUESTIONNAIRE_GROUP_CHILD_EXCLUDED_TYPE_VALUES,
      QUESTIONNAIRE_NON_ANSWER_ROW_TYPE_VALUES,
    ].map((group) => [group] as const),
  )("is a duplicate-free subset of all types", (group: readonly string[]) => {
    expect(new Set(group).size).toBe(group.length);
    for (const type of group)
      expect(QUESTIONNAIRE_FIELD_TYPE_VALUES).toContain(type);
  });

  it("answers a scale with a value although it has options", () => {
    expect(QUESTIONNAIRE_CHOICE_FIELD_TYPE_VALUES).toContain(
      QuestionnaireFieldType.Scale,
    );
    expect(QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES).not.toContain(
      QuestionnaireFieldType.Scale,
    );
  });

  it("lets only choice answers trigger a condition", () => {
    expect(QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES).toEqual(
      QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES,
    );
  });

  it("limits the length only of free text", () => {
    for (const type of QUESTIONNAIRE_LENGTH_LIMITED_FIELD_TYPE_VALUES)
      expect(QUESTIONNAIRE_TEXT_FIELD_TYPE_VALUES).toContain(type);
  });
});

describe("questionnaire prefill sources", () => {
  it("maps every source to a free-text type", () => {
    expect(
      Object.keys(QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES).sort(),
    ).toEqual([...QUESTIONNAIRE_PREFILL_SOURCE_VALUES].sort());
    for (const type of Object.values(QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES))
      expect(QUESTIONNAIRE_TEXT_FIELD_TYPE_VALUES).toContain(type);
  });
});

describe("questionnaire keys and limits", () => {
  it("accepts snake_case keys and rejects everything else", () => {
    const key = new RegExp(QUESTIONNAIRE_KEY_PATTERN_SOURCE);
    expect(key.test("company_profile")).toBe(true);
    expect(key.test("a")).toBe(false);
    expect(key.test("Company")).toBe(false);
    expect(key.test("1st_block")).toBe(false);
    const longest = "a".repeat(QUESTIONNAIRE_LIMITS.keyMaxLength);
    expect(key.test(longest)).toBe(true);
    expect(key.test(`${longest}a`)).toBe(false);
  });

  it("allows the fixed choice keys", () => {
    const key = new RegExp(QUESTIONNAIRE_CHOICE_KEY_PATTERN_SOURCE);
    for (const value of [
      ...QUESTIONNAIRE_YES_NO_CHOICE_KEY_VALUES,
      ...QUESTIONNAIRE_SCALE_CHOICE_KEY_VALUES,
      "a",
    ])
      expect(key.test(value)).toBe(true);
  });

  it("offers every uploadable asset kind for files fields, but no link", () => {
    expect(QUESTIONNAIRE_ACCEPTED_ASSET_KIND_VALUES).toEqual(
      ASSET_KIND_VALUES.filter((kind) => kind !== AssetKind.Link),
    );
  });

  it("keeps every working limit below its storage ceiling", () => {
    const L = QUESTIONNAIRE_LIMITS;
    for (const count of [
      L.blocksPerOwner,
      L.fieldsPerBlock,
      L.childFieldsPerGroup,
      L.groupEntriesPerField,
      L.filesPerField,
    ])
      expect(count).toBeLessThanOrEqual(L.storedPositionCeiling);
    expect(L.choicesPerField).toBeLessThanOrEqual(
      L.storedChoicePositionCeiling,
    );
    expect(L.groupEntriesPerField).toBeLessThanOrEqual(
      L.storedItemCountCeiling,
    );
    expect(L.longTextDefaultMaxLength).toBeLessThanOrEqual(
      L.storedValueMaxLength,
    );
    expect(L.shortTextDefaultMaxLength).toBeLessThan(
      L.longTextDefaultMaxLength,
    );
  });
});
