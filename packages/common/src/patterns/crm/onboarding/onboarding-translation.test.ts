import { describe, expect, it } from "vitest";
import { OnboardingCatalogStatus } from "../../../constants/crm/onboarding/onboarding-catalog-statuses";
import { OnboardingFieldRequirement } from "../../../constants/crm/onboarding/onboarding-field-requirements";
import { OnboardingFieldType } from "../../../constants/crm/onboarding/onboarding-field-types";
import type { OnboardingBlockDto } from "../../../contracts/crm/onboarding/onboarding-block.dto";
import type { OnboardingFieldDto } from "../../../contracts/crm/onboarding/onboarding-field.dto";
import { Locale } from "@invessiv/common";
import {
  missingOnboardingLocales,
  resolveOnboardingText,
} from "./onboarding-translation";

function field(
  overrides: Partial<OnboardingFieldDto> = {},
): OnboardingFieldDto {
  return {
    id: "f",
    blockId: "b",
    parentFieldId: null,
    key: "f_key",
    position: 0,
    type: OnboardingFieldType.ShortText,
    requirement: OnboardingFieldRequirement.Required,
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

function block(fields: OnboardingFieldDto[]): OnboardingBlockDto {
  return {
    id: "b",
    key: "company",
    carryOver: true,
    status: OnboardingCatalogStatus.Active,
    sourceBlockId: null,
    translations: {
      de: { title: "Unternehmen", intro: null },
      en: { title: "Company", intro: null },
    },
    fields,
    version: 1,
  };
}

describe("resolveOnboardingText", () => {
  it("returns the preferred locale", () => {
    expect(
      resolveOnboardingText({ de: "Hallo", en: "Hello" }, Locale.En),
    ).toEqual({ text: "Hello", locale: Locale.En, isFallback: false });
  });

  it("falls back in supported-locale order", () => {
    expect(resolveOnboardingText({ de: "Hallo" }, Locale.En)).toEqual({
      text: "Hallo",
      locale: Locale.De,
      isFallback: true,
    });
  });

  it("returns null without any translation", () => {
    expect(resolveOnboardingText({}, Locale.De)).toBeNull();
  });
});

describe("missingOnboardingLocales", () => {
  it("is empty for a fully translated block", () => {
    expect(missingOnboardingLocales(block([field()]))).toEqual([]);
  });

  it("finds a locale missing on a choice of a sub-field", () => {
    const child = field({
      id: "c",
      parentFieldId: "g",
      type: OnboardingFieldType.Choice,
      choices: [
        { id: "o", key: "a", position: 0, labels: { de: "A" }, version: 1 },
      ],
    });
    const group = field({
      id: "g",
      type: OnboardingFieldType.Group,
      children: [child],
    });
    expect(missingOnboardingLocales(block([group]))).toEqual([Locale.En]);
  });

  it("finds a locale missing on the block itself", () => {
    const partial = block([field()]);
    partial.translations = { en: { title: "Company", intro: null } };
    expect(missingOnboardingLocales(partial)).toEqual([Locale.De]);
  });
});
