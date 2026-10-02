import { describe, expect, it } from "vitest";
import { Locale } from "@invessiv/common";
import { OnboardingReleaseWarningKind } from "../../../constants/crm/onboarding/onboarding-release-warning-kinds";
import { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "../../../constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireBlockDto } from "../../../contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "../../../contracts/crm/questionnaire/questionnaire-field.dto";
import {
  isOnboardingFormReleasable,
  listOnboardingReleaseWarnings,
} from "./onboarding-release-check";

const BOTH = {
  de: { label: "Firma", help: null },
  en: { label: "Company", help: null },
};

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
    requirement: QuestionnaireFieldRequirement.Optional,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: BOTH,
    choices: [],
    children: [],
    version: 1,
    ...overrides,
  };
}

function block(
  id: string,
  fields: QuestionnaireFieldDto[],
  locales: Locale[] = [Locale.De, Locale.En],
): QuestionnaireBlockDto {
  return {
    id,
    key: `key_${id}`,
    carryOver: false,
    status: QuestionnaireCatalogStatus.Active,
    sourceBlockId: null,
    translations: Object.fromEntries(
      locales.map((locale) => [locale, { title: "Titel", intro: null }]),
    ),
    fields,
    version: 1,
  };
}

const group = (children: QuestionnaireFieldDto[]) =>
  field({ type: QuestionnaireFieldType.Group, children });

describe("isOnboardingFormReleasable", () => {
  it("accepts blocks that each ask something", () => {
    expect(
      isOnboardingFormReleasable([
        block("a", [field()]),
        block("b", [group([field()])]),
      ]),
    ).toBe(true);
  });

  it("refuses a form without blocks", () => {
    expect(isOnboardingFormReleasable([])).toBe(false);
  });

  it("refuses a block without fields", () => {
    expect(
      isOnboardingFormReleasable([block("a", [field()]), block("b", [])]),
    ).toBe(false);
  });

  it("refuses a group without sub-fields", () => {
    expect(isOnboardingFormReleasable([block("a", [field(), group([])])])).toBe(
      false,
    );
  });
});

describe("listOnboardingReleaseWarnings", () => {
  it("finds nothing when every block speaks the contacts' languages", () => {
    expect(
      listOnboardingReleaseWarnings(
        [block("a", [field()])],
        [Locale.De, Locale.En],
      ),
    ).toEqual([]);
  });

  it("names each block that lacks a contact's language, in form order", () => {
    const germanOnly = { de: { label: "Firma", help: null } };
    expect(
      listOnboardingReleaseWarnings(
        [
          block("a", [field()], [Locale.De]),
          block("b", [field()]),
          block("c", [field({ translations: germanOnly })]),
        ],
        [Locale.En, Locale.De],
      ),
    ).toEqual([
      {
        kind: OnboardingReleaseWarningKind.MissingTranslation,
        blockId: "a",
        locale: Locale.En,
      },
      {
        kind: OnboardingReleaseWarningKind.MissingTranslation,
        blockId: "c",
        locale: Locale.En,
      },
    ]);
  });

  it("ignores a missing language nobody among the contacts prefers", () => {
    expect(
      listOnboardingReleaseWarnings(
        [block("a", [field()], [Locale.De])],
        [Locale.De],
      ),
    ).toEqual([]);
  });

  it("warns once when the customer has no portal contact, without language warnings", () => {
    expect(
      listOnboardingReleaseWarnings([block("a", [field()], [Locale.De])], []),
    ).toEqual([{ kind: OnboardingReleaseWarningKind.NoPortalAccess }]);
  });
});
