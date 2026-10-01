import { describe, expect, it } from "vitest";

import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnaireValueErrorCode } from "@invessiv/common/constants/crm/questionnaire/questionnaire-value-error-codes";
import type { QuestionnaireAnswerDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer.dto";
import { onboardingAnswerDrafts as drafts } from "@/common/patterns/portal/onboarding-answer-drafts";

const text = { id: "name", type: T.ShortText, maxLength: null };
const mail = { id: "mail", type: T.Email, maxLength: null };
const multi = { id: "many", type: T.MultiChoice, maxLength: null };
const fields = new Map([text, mail, multi].map((field) => [field.id, field]));

function answer(
  overrides: Partial<QuestionnaireAnswerDto>,
): QuestionnaireAnswerDto {
  return {
    fieldId: "name",
    groupEntryId: null,
    sortOrder: 0,
    value: null,
    choiceId: null,
    ...overrides,
  };
}

describe("onboardingAnswerDrafts.fromAnswers", () => {
  it("collects text and options per field in stored order", () => {
    const result = drafts.fromAnswers([
      answer({ fieldId: "many", sortOrder: 1, choiceId: "b" }),
      answer({ value: "Acme" }),
      answer({ fieldId: "many", sortOrder: 0, choiceId: "a" }),
    ]);

    expect(Object.fromEntries(result)).toEqual({
      many: ["a", "b"],
      name: ["Acme"],
    });
  });

  it("leaves answers of group entries out", () => {
    expect(
      drafts.fromAnswers([answer({ groupEntryId: "entry-1", value: "x" })])
        .size,
    ).toBe(0);
  });
});

describe("onboardingAnswerDrafts.validate", () => {
  it("accepts blank text, valid text and any selection", () => {
    expect(drafts.validate(mail, [])).toBeNull();
    expect(drafts.validate(mail, ["  "])).toBeNull();
    expect(drafts.validate(mail, ["a@example.com"])).toBeNull();
    expect(drafts.validate(multi, ["a", "b"])).toBeNull();
  });

  it("names why a text cannot be saved", () => {
    expect(drafts.validate(mail, ["nope"])).toBe(
      QuestionnaireValueErrorCode.InvalidEmail,
    );
    expect(drafts.validate({ ...text, maxLength: 3 }, ["Acme"])).toBe(
      QuestionnaireValueErrorCode.TooLong,
    );
  });
});

describe("onboardingAnswerDrafts.toAnswers", () => {
  it("turns drafts into answer rows and keeps group answers", () => {
    const grouped = answer({
      fieldId: "member",
      groupEntryId: "entry-1",
      value: "Ada",
    });

    expect(
      drafts.toAnswers(
        new Map([
          ["name", ["Acme"]],
          ["many", ["b", "a"]],
        ]),
        fields,
        [grouped, answer({ value: "Old" })],
      ),
    ).toEqual([
      grouped,
      answer({ value: "Acme" }),
      answer({ fieldId: "many", sortOrder: 0, choiceId: "b" }),
      answer({ fieldId: "many", sortOrder: 1, choiceId: "a" }),
    ]);
  });

  it("counts neither blank nor invalid text nor unknown fields as answers", () => {
    expect(
      drafts.toAnswers(
        new Map([
          ["name", [" "]],
          ["mail", ["nope"]],
          ["gone", ["x"]],
        ]),
        fields,
        [],
      ),
    ).toEqual([]);
  });
});

describe("onboardingAnswerDrafts.toRequest", () => {
  it("sends text as values and a selection as choice ids", () => {
    expect(drafts.toRequest(text, ["Acme"])).toEqual({
      fieldId: "name",
      groupEntryId: null,
      values: ["Acme"],
    });
    expect(drafts.toRequest(multi, ["a"])).toEqual({
      fieldId: "many",
      groupEntryId: null,
      choiceIds: ["a"],
    });
  });

  it("clears the slot for blank text and an empty selection", () => {
    expect(drafts.toRequest(text, ["  "]).values).toEqual([]);
    expect(drafts.toRequest(text, []).values).toEqual([]);
    expect(drafts.toRequest(multi, []).choiceIds).toEqual([]);
  });
});
