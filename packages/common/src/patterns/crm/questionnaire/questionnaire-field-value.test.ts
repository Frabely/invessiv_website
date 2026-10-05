import { describe, expect, it } from "vitest";
import {
  QUESTIONNAIRE_FIELD_TYPE_VALUES,
  QuestionnaireFieldType,
} from "../../../constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "../../../constants/crm/questionnaire/questionnaire-limits";
import { QuestionnaireValueErrorCode } from "../../../constants/crm/questionnaire/questionnaire-value-error-codes";
import {
  getQuestionnaireValueMaxLength,
  normalizeQuestionnaireValue,
  validateQuestionnaireValue,
} from "./questionnaire-field-value";

function check(
  type: (typeof QUESTIONNAIRE_FIELD_TYPE_VALUES)[number],
  raw: string,
  maxLength: number | null = null,
) {
  return validateQuestionnaireValue({ type, maxLength }, raw);
}

const T = QuestionnaireFieldType;
const E = QuestionnaireValueErrorCode;

describe("validateQuestionnaireValue", () => {
  it("accepts URLs up to 2048 characters and rejects longer URLs", () => {
    const prefix = "https://example.com/maps?location=";
    const url = prefix + "a".repeat(2048 - prefix.length);
    expect(check(T.Url, url)).toEqual({ ok: true });
    expect(check(T.Url, url + "a")).toEqual({
      ok: false,
      code: E.TooLong,
    });
    expect(check(T.Url, "x".repeat(400))).toEqual({
      ok: false,
      code: E.InvalidUrl,
    });
  });

  it.each([
    [T.ShortText, "Nordlicht GmbH"],
    [T.LongText, "Wir bauen Häuser.\nSeit 1990."],
    [T.Email, "info@nordlicht.de"],
    [T.Phone, "+49 (0)30 123 456"],
    [T.Url, "https://nordlicht.de"],
    [T.Url, "http://nordlicht.de/kontakt"],
    [T.Color, "#1A2b3C"],
    [T.Scale, "1"],
    [T.Scale, String(QUESTIONNAIRE_LIMITS.scaleSteps)],
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
    [T.Scale, String(QUESTIONNAIRE_LIMITS.scaleSteps + 1), E.InvalidScale],
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

  it("judges a single-line value as it is stored, without the space around it", () => {
    expect(check(T.ShortText, " abc\n", 3)).toEqual({ ok: true });
    expect(check(T.Color, " #1A2b3C ")).toEqual({ ok: true });
    expect(check(T.Scale, "3 ")).toEqual({ ok: true });
    expect(check(T.Confirmation, " true")).toEqual({ ok: true });
  });

  it("counts the space around a long text, which is stored as typed", () => {
    expect(check(T.LongText, "abc\n", 3)).toEqual({
      ok: false,
      code: E.TooLong,
    });
  });

  it("falls back to the type default length", () => {
    const short = "x".repeat(
      QUESTIONNAIRE_LIMITS.shortTextDefaultMaxLength + 1,
    );
    expect(check(T.ShortText, short)).toEqual({ ok: false, code: E.TooLong });
    expect(check(T.LongText, short)).toEqual({ ok: true });
  });
});

describe("normalizeQuestionnaireValue", () => {
  it("trims every value but a long text", () => {
    const normalize = (
      type: (typeof QUESTIONNAIRE_FIELD_TYPE_VALUES)[number],
    ) => normalizeQuestionnaireValue({ type, maxLength: null }, " a \n");

    expect(normalize(T.ShortText)).toBe("a");
    expect(normalize(T.Email)).toBe("a");
    expect(normalize(T.LongText)).toBe(" a \n");
  });
});

describe("getQuestionnaireValueMaxLength", () => {
  it("separates URL limits from short text and contact limits", () => {
    expect(
      getQuestionnaireValueMaxLength({ type: T.Url, maxLength: null }),
    ).toBe(2048);
    for (const type of [T.ShortText, T.Email, T.Phone]) {
      expect(getQuestionnaireValueMaxLength({ type, maxLength: null })).toBe(
        300,
      );
    }
  });

  it("bounds only free text", () => {
    expect(
      getQuestionnaireValueMaxLength({ type: T.LongText, maxLength: null }),
    ).toBe(QUESTIONNAIRE_LIMITS.longTextDefaultMaxLength);
    expect(
      getQuestionnaireValueMaxLength({ type: T.Email, maxLength: null }),
    ).toBe(QUESTIONNAIRE_LIMITS.shortTextDefaultMaxLength);
    expect(
      getQuestionnaireValueMaxLength({ type: T.Color, maxLength: null }),
    ).toBe(null);
  });
});
