import { describe, expect, it } from "vitest";

import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnaireValueErrorCode } from "@invessiv/common/constants/crm/questionnaire/questionnaire-value-error-codes";
import type { QuestionnaireAnswerDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer.dto";
import { onboardingAnswerDrafts as drafts } from "@/common/patterns/portal/onboarding-answer-drafts";
import {
  portalOnboardingBlock,
  portalOnboardingChoices,
  portalOnboardingField,
} from "@/components/shared/onboarding/testing/portal-onboarding-form-fixture";

const text = { id: "name", type: T.ShortText, maxLength: null };
const mail = { id: "mail", type: T.Email, maxLength: null };
const multi = { id: "many", type: T.MultiChoice, maxLength: null };
const member = { id: "member", type: T.ShortText, maxLength: null };
const fields = new Map(
  [text, mail, multi, member].map((field) => [field.id, field]),
);

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

describe("onboardingAnswerDrafts.listInvalid", () => {
  const ask = portalOnboardingField("ask", {
    type: T.YesNo,
    choices: portalOnboardingChoices("ask", "yes", "no"),
  });
  const askMail = portalOnboardingField("askmail", {
    type: T.Email,
    conditionFieldId: "ask",
    conditionChoiceId: "ask-yes",
  });
  const blocks = [portalOnboardingBlock("block-1", [ask, askMail])];
  const index = drafts.indexFields(blocks);

  it("names invalid text of a field that is visible", () => {
    const typed = new Map([
      ["ask", ["ask-yes"]],
      ["askmail", ["nope"]],
    ]);

    expect([...drafts.listInvalid(typed, index, blocks)]).toEqual([
      ["askmail", QuestionnaireValueErrorCode.InvalidEmail],
    ]);
  });

  it("leaves out a field its condition hides", () => {
    const typed = new Map([
      ["ask", ["ask-no"]],
      ["askmail", ["nope"]],
    ]);

    expect(drafts.listInvalid(typed, index, blocks).size).toBe(0);
  });
});

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

  it("keeps the answers of group entries apart, one slot per entry", () => {
    const result = drafts.fromAnswers([
      answer({ fieldId: "member", groupEntryId: "entry-1", value: "Ada" }),
      answer({ fieldId: "member", groupEntryId: "entry-2", value: "Grace" }),
    ]);

    expect(Object.fromEntries(result)).toEqual({
      [drafts.slotKey("member", "entry-1")]: ["Ada"],
      [drafts.slotKey("member", "entry-2")]: ["Grace"],
    });
  });
});

describe("onboardingAnswerDrafts slot keys", () => {
  it("uses the field id alone on block level", () => {
    expect(drafts.slotKey("name", null)).toBe("name");
    expect(drafts.parseSlotKey("name")).toEqual({
      fieldId: "name",
      groupEntryId: null,
    });
  });

  it("round-trips the slot of a group entry", () => {
    const key = drafts.slotKey("member", "entry-1");

    expect(key).not.toBe("member");
    expect(drafts.parseSlotKey(key)).toEqual({
      fieldId: "member",
      groupEntryId: "entry-1",
    });
  });

  it("drops every slot of a removed entry and nothing else", () => {
    const current = new Map([
      ["name", ["Acme"]],
      [drafts.slotKey("member", "entry-1"), ["Ada"]],
      [drafts.slotKey("member", "entry-2"), ["Grace"]],
    ]);

    expect(Object.fromEntries(drafts.dropEntry(current, "entry-1"))).toEqual({
      name: ["Acme"],
      [drafts.slotKey("member", "entry-2")]: ["Grace"],
    });
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
  it("turns drafts into answer rows, sub-field drafts with their entry", () => {
    expect(
      drafts.toAnswers(
        new Map([
          ["name", ["Acme"]],
          ["many", ["b", "a"]],
          [drafts.slotKey("member", "entry-1"), ["Ada"]],
        ]),
        fields,
      ),
    ).toEqual([
      answer({ value: "Acme" }),
      answer({ fieldId: "many", sortOrder: 0, choiceId: "b" }),
      answer({ fieldId: "many", sortOrder: 1, choiceId: "a" }),
      answer({ fieldId: "member", groupEntryId: "entry-1", value: "Ada" }),
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

  it("addresses the entry of a sub-field answer", () => {
    expect(drafts.toRequest(member, ["Ada"], "entry-1")).toEqual({
      fieldId: "member",
      groupEntryId: "entry-1",
      values: ["Ada"],
    });
  });

  it("clears the slot for blank text and an empty selection", () => {
    expect(drafts.toRequest(text, ["  "]).values).toEqual([]);
    expect(drafts.toRequest(text, []).values).toEqual([]);
    expect(drafts.toRequest(multi, []).choiceIds).toEqual([]);
  });
});
