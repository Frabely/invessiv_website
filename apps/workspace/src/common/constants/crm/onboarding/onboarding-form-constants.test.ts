import { describe, expect, it } from "vitest";

import { ONBOARDING_ERROR_CODE_VALUES } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { QUESTIONNAIRE_ERROR_CODE_VALUES } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { ONBOARDING_FORM_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import de from "@/i18n/dictionaries/workspace/crm/onboarding/de.json";
import en from "@/i18n/dictionaries/workspace/crm/onboarding/en.json";
import { ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES } from "./onboarding-form-client-error-codes";
import { OnboardingFormQueryParam } from "./onboarding-form-query-params";
import { ONBOARDING_FORM_STATUS_BADGES } from "./onboarding-form-status-badges";
import {
  ONBOARDING_FORM_TAB_VALUES,
  OnboardingFormTab,
} from "./onboarding-form-tabs";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("onboarding form constants", () => {
  it("lists every tab exactly once", () => {
    expect([...ONBOARDING_FORM_TAB_VALUES]).toEqual(
      Object.values(OnboardingFormTab),
    );
    expect(OnboardingFormTab).toEqual({
      Structure: "structure",
      Answers: "answers",
      Review: "review",
    });
  });

  it("names the query params of the form page", () => {
    expect(OnboardingFormQueryParam).toEqual({ Tab: "tab", Block: "block" });
  });

  it("knows every code a form endpoint answers with, each once", () => {
    expect(new Set(ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES)).toEqual(
      new Set([
        ...ONBOARDING_ERROR_CODE_VALUES,
        ...QUESTIONNAIRE_ERROR_CODE_VALUES,
      ]),
    );
    expect(new Set(ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES).size).toBe(
      ONBOARDING_FORM_CLIENT_ERROR_CODE_VALUES.length,
    );
  });

  it("has a badge for every form status", () => {
    expect(Object.keys(ONBOARDING_FORM_STATUS_BADGES)).toEqual([
      ...ONBOARDING_FORM_STATUS_VALUES,
    ]);
  });
});

describe("onboarding dictionaries", () => {
  it("keep identical keys in every locale", () => {
    expect(keyPaths(en)).toEqual(keyPaths(de));
  });

  it.each([
    ["de", de],
    ["en", en],
  ])("%s has a text for every status, tab and error code", (_, dictionary) => {
    expect(Object.keys(dictionary.status)).toEqual([
      ...ONBOARDING_FORM_STATUS_VALUES,
    ]);
    expect(Object.keys(dictionary.errors)).toEqual([
      ...ONBOARDING_ERROR_CODE_VALUES,
    ]);
    expect(Object.keys(dictionary.form.tabs)).toEqual([
      "ariaLabel",
      ...ONBOARDING_FORM_TAB_VALUES,
    ]);
  });
});
