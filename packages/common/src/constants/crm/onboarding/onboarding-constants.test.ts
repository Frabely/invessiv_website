import { describe, expect, it } from "vitest";
import {
  PORTAL_ONBOARDING_ERROR_CODE_VALUES,
  PortalOnboardingErrorCode,
} from "../../portal/portal-onboarding-error-codes";
import {
  ONBOARDING_BLOCK_REVIEW_STATUS_VALUES,
  OnboardingBlockReviewStatus,
} from "./onboarding-block-review-statuses";
import {
  ONBOARDING_CATALOG_STATUS_VALUES,
  OnboardingCatalogStatus,
} from "./onboarding-catalog-statuses";
import {
  ONBOARDING_CLARIFICATION_MODE_VALUES,
  OnboardingClarificationMode,
} from "./onboarding-clarification-modes";
import {
  ONBOARDING_FIELD_REQUIREMENT_VALUES,
  OnboardingFieldRequirement,
} from "./onboarding-field-requirements";
import {
  ONBOARDING_CHOICE_ANSWER_TYPE_VALUES,
  ONBOARDING_CHOICE_FIELD_TYPE_VALUES,
  ONBOARDING_CONDITION_TRIGGER_TYPE_VALUES,
  ONBOARDING_FIELD_TYPE_VALUES,
  ONBOARDING_GROUP_CHILD_EXCLUDED_TYPE_VALUES,
  ONBOARDING_ITEM_COUNT_FIELD_TYPE_VALUES,
  ONBOARDING_LENGTH_LIMITED_FIELD_TYPE_VALUES,
  ONBOARDING_NON_ANSWER_ROW_TYPE_VALUES,
  ONBOARDING_TEXT_FIELD_TYPE_VALUES,
  OnboardingFieldType,
} from "./onboarding-field-types";
import {
  ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES,
  ONBOARDING_FORM_STATUS_VALUES,
  ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES,
  ONBOARDING_SUBMITTED_STATUS_VALUES,
  OnboardingFormStatus,
} from "./onboarding-form-statuses";
import { ONBOARDING_FORM_TRANSITIONS } from "./onboarding-form-transitions";
import {
  ONBOARDING_KEY_PATTERN_SOURCE,
  ONBOARDING_CHOICE_KEY_PATTERN_SOURCE,
} from "./onboarding-key-patterns";
import { ONBOARDING_LIMITS } from "./onboarding-limits";
import {
  ONBOARDING_PREFILL_SOURCE_FIELD_TYPES,
  ONBOARDING_PREFILL_SOURCE_VALUES,
  OnboardingPrefillSource,
} from "./onboarding-prefill-sources";
import {
  ONBOARDING_SCALE_CHOICE_KEY_VALUES,
  OnboardingScaleChoiceKey,
} from "./onboarding-scale-choice-keys";
import {
  ONBOARDING_TRANSITION_SIDE_VALUES,
  OnboardingTransitionSide,
} from "./onboarding-transition-sides";
import {
  ONBOARDING_VALUE_ERROR_CODE_VALUES,
  OnboardingValueErrorCode,
} from "./onboarding-value-error-codes";
import {
  ONBOARDING_YES_NO_CHOICE_KEY_VALUES,
  OnboardingYesNoChoiceKey,
} from "./onboarding-yes-no-choice-keys";

describe("onboarding const objects", () => {
  it.each([
    [OnboardingFieldType, ONBOARDING_FIELD_TYPE_VALUES],
    [OnboardingFieldRequirement, ONBOARDING_FIELD_REQUIREMENT_VALUES],
    [OnboardingFormStatus, ONBOARDING_FORM_STATUS_VALUES],
    [OnboardingTransitionSide, ONBOARDING_TRANSITION_SIDE_VALUES],
    [OnboardingCatalogStatus, ONBOARDING_CATALOG_STATUS_VALUES],
    [OnboardingBlockReviewStatus, ONBOARDING_BLOCK_REVIEW_STATUS_VALUES],
    [OnboardingClarificationMode, ONBOARDING_CLARIFICATION_MODE_VALUES],
    [OnboardingPrefillSource, ONBOARDING_PREFILL_SOURCE_VALUES],
    [OnboardingYesNoChoiceKey, ONBOARDING_YES_NO_CHOICE_KEY_VALUES],
    [OnboardingScaleChoiceKey, ONBOARDING_SCALE_CHOICE_KEY_VALUES],
    [OnboardingValueErrorCode, ONBOARDING_VALUE_ERROR_CODE_VALUES],
    [PortalOnboardingErrorCode, PORTAL_ONBOARDING_ERROR_CODE_VALUES],
  ] as const)("lists every value exactly once", (constObject, values) => {
    expect([...values]).toEqual(Object.values(constObject));
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("onboarding field type groups", () => {
  it.each(
    [
      ONBOARDING_CHOICE_FIELD_TYPE_VALUES,
      ONBOARDING_CHOICE_ANSWER_TYPE_VALUES,
      ONBOARDING_CONDITION_TRIGGER_TYPE_VALUES,
      ONBOARDING_TEXT_FIELD_TYPE_VALUES,
      ONBOARDING_LENGTH_LIMITED_FIELD_TYPE_VALUES,
      ONBOARDING_ITEM_COUNT_FIELD_TYPE_VALUES,
      ONBOARDING_GROUP_CHILD_EXCLUDED_TYPE_VALUES,
      ONBOARDING_NON_ANSWER_ROW_TYPE_VALUES,
    ].map((group) => [group] as const),
  )("is a duplicate-free subset of all types", (group: readonly string[]) => {
    expect(new Set(group).size).toBe(group.length);
    for (const type of group)
      expect(ONBOARDING_FIELD_TYPE_VALUES).toContain(type);
  });

  it("answers a scale with a value although it has options", () => {
    expect(ONBOARDING_CHOICE_FIELD_TYPE_VALUES).toContain(
      OnboardingFieldType.Scale,
    );
    expect(ONBOARDING_CHOICE_ANSWER_TYPE_VALUES).not.toContain(
      OnboardingFieldType.Scale,
    );
  });

  it("lets only choice answers trigger a condition", () => {
    expect(ONBOARDING_CONDITION_TRIGGER_TYPE_VALUES).toEqual(
      ONBOARDING_CHOICE_ANSWER_TYPE_VALUES,
    );
  });

  it("limits the length only of free text", () => {
    for (const type of ONBOARDING_LENGTH_LIMITED_FIELD_TYPE_VALUES)
      expect(ONBOARDING_TEXT_FIELD_TYPE_VALUES).toContain(type);
  });
});

describe("onboarding form statuses", () => {
  it("never leaves completed", () => {
    const origins: readonly OnboardingFormStatus[] =
      ONBOARDING_FORM_TRANSITIONS.map((transition) => transition.from);
    expect(origins).not.toContain(OnboardingFormStatus.Completed);
  });

  it("reaches every status except the initial draft", () => {
    const targets = new Set(
      ONBOARDING_FORM_TRANSITIONS.map((transition) => transition.to),
    );
    expect(targets).toEqual(
      new Set(
        ONBOARDING_FORM_STATUS_VALUES.filter(
          (status) => status !== OnboardingFormStatus.Draft,
        ),
      ),
    );
  });

  it("lets the customer move only out of editable statuses", () => {
    for (const transition of ONBOARDING_FORM_TRANSITIONS) {
      if (transition.side !== OnboardingTransitionSide.Customer) continue;
      expect(ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES).toContain(
        transition.from,
      );
    }
  });

  it("hides only the draft from the portal", () => {
    expect(ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES).toEqual(
      ONBOARDING_FORM_STATUS_VALUES.filter(
        (status) => status !== OnboardingFormStatus.Draft,
      ),
    );
  });

  it("treats every status after the first submission as submitted", () => {
    expect(ONBOARDING_SUBMITTED_STATUS_VALUES).toEqual([
      "submitted",
      "changes_requested",
      "completed",
    ]);
  });
});

describe("onboarding prefill sources", () => {
  it("maps every source to a free-text type", () => {
    expect(Object.keys(ONBOARDING_PREFILL_SOURCE_FIELD_TYPES).sort()).toEqual(
      [...ONBOARDING_PREFILL_SOURCE_VALUES].sort(),
    );
    for (const type of Object.values(ONBOARDING_PREFILL_SOURCE_FIELD_TYPES))
      expect(ONBOARDING_TEXT_FIELD_TYPE_VALUES).toContain(type);
  });
});

describe("onboarding keys and limits", () => {
  it("accepts snake_case keys and rejects everything else", () => {
    const key = new RegExp(ONBOARDING_KEY_PATTERN_SOURCE);
    expect(key.test("company_profile")).toBe(true);
    expect(key.test("a")).toBe(false);
    expect(key.test("Company")).toBe(false);
    expect(key.test("1st_block")).toBe(false);
    expect(key.test(`a${"b".repeat(62)}`)).toBe(true);
    expect(key.test(`a${"b".repeat(63)}`)).toBe(false);
  });

  it("allows the fixed choice keys", () => {
    const key = new RegExp(ONBOARDING_CHOICE_KEY_PATTERN_SOURCE);
    for (const value of [
      ...ONBOARDING_YES_NO_CHOICE_KEY_VALUES,
      ...ONBOARDING_SCALE_CHOICE_KEY_VALUES,
      "a",
    ])
      expect(key.test(value)).toBe(true);
  });

  it("keeps every working limit below its storage ceiling", () => {
    const L = ONBOARDING_LIMITS;
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
