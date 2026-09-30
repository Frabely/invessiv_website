import { describe, expect, it } from "vitest";
import {
  ONBOARDING_FIELD_TYPE_VALUES,
  OnboardingFieldType,
} from "../../../constants/crm/onboarding/onboarding-field-types";
import { ONBOARDING_LIMITS } from "../../../constants/crm/onboarding/onboarding-limits";
import { OnboardingValueErrorCode } from "../../../constants/crm/onboarding/onboarding-value-error-codes";
import {
  getOnboardingValueMaxLength,
  validateOnboardingValue,
} from "./onboarding-field-value";

function check(
  type: (typeof ONBOARDING_FIELD_TYPE_VALUES)[number],
  raw: string,
  maxLength: number | null = null,
) {
  return validateOnboardingValue({ type, maxLength }, raw);
}

const T = OnboardingFieldType;
const E = OnboardingValueErrorCode;

describe("validateOnboardingValue", () => {
  it.each([
    [T.ShortText, "Nordlicht GmbH"],
    [T.LongText, "Wir bauen Häuser.\nSeit 1990."],
    [T.Email, "info@nordlicht.de"],
    [T.Phone, "+49 (0)30 123 456"],
    [T.Url, "https://nordlicht.de"],
    [T.Url, "http://nordlicht.de/kontakt"],
    [T.Color, "#1A2b3C"],
    [T.Scale, "1"],
    [T.Scale, String(ONBOARDING_LIMITS.scaleSteps)],
    [T.Confirmation, "true"],
  ] as const)("accepts a valid %s value", (type, raw) => {
    expect(check(type, raw)).toEqual({ ok: true });
  });

  it.each([
    [T.Email, "info@nordlicht", E.InvalidEmail],
    [T.Phone, "call me", E.InvalidPhone],
    [T.Url, "nordlicht.de", E.InvalidUrl],
    [T.Url, "ftp://nordlicht.de", E.InvalidUrl],
    [T.Color, "#12345", E.InvalidColor],
    [T.Color, "red", E.InvalidColor],
    [T.Scale, "0", E.InvalidScale],
    [T.Scale, String(ONBOARDING_LIMITS.scaleSteps + 1), E.InvalidScale],
    [T.Scale, "2.5", E.InvalidScale],
    [T.Confirmation, "false", E.NotConfirmed],
    [T.ShortText, "   ", E.Empty],
  ] as const)("rejects %s value %j", (type, raw, code) => {
    expect(check(type, raw)).toEqual({ ok: false, code });
  });

  it.each([
    T.Choice,
    T.MultiChoice,
    T.YesNo,
    T.Files,
    T.Group,
    T.ProjectServices,
  ] as const)("refuses a value for %s", (type) => {
    expect(check(type, "x")).toEqual({ ok: false, code: E.NotAValueField });
  });

  it("applies the field's own max length", () => {
    expect(check(T.ShortText, "abcd", 3)).toEqual({
      ok: false,
      code: E.TooLong,
    });
    expect(check(T.ShortText, "abc", 3)).toEqual({ ok: true });
  });

  it("falls back to the type default length", () => {
    const short = "x".repeat(ONBOARDING_LIMITS.shortTextDefaultMaxLength + 1);
    expect(check(T.ShortText, short)).toEqual({ ok: false, code: E.TooLong });
    expect(check(T.LongText, short)).toEqual({ ok: true });
  });
});

describe("getOnboardingValueMaxLength", () => {
  it("bounds only free text", () => {
    expect(
      getOnboardingValueMaxLength({ type: T.LongText, maxLength: null }),
    ).toBe(ONBOARDING_LIMITS.longTextDefaultMaxLength);
    expect(
      getOnboardingValueMaxLength({ type: T.Email, maxLength: null }),
    ).toBe(ONBOARDING_LIMITS.shortTextDefaultMaxLength);
    expect(
      getOnboardingValueMaxLength({ type: T.Color, maxLength: null }),
    ).toBe(null);
  });
});
