import { describe, expect, it } from "vitest";
import { QUESTIONNAIRE_FIELD_TYPE_VALUES } from "../../../constants/crm/questionnaire/questionnaire-field-types";
import {
  isQuestionnaireChoiceAnswerType,
  parseQuestionnaireSlotKey,
  questionnaireSlotKey,
} from "./questionnaire-answer-slot";

describe("questionnaireSlotKey", () => {
  it("is the field id on block level and names the entry of a sub-field", () => {
    expect(questionnaireSlotKey("field-1", null)).toBe("field-1");
    expect(questionnaireSlotKey("field-1", "entry-1")).toBe("field-1@entry-1");
  });

  it("splits back into field and entry", () => {
    for (const slot of [
      { fieldId: "field-1", groupEntryId: null },
      { fieldId: "field-1", groupEntryId: "entry-1" },
    ])
      expect(
        parseQuestionnaireSlotKey(
          questionnaireSlotKey(slot.fieldId, slot.groupEntryId),
        ),
      ).toEqual(slot);
  });
});

describe("isQuestionnaireChoiceAnswerType", () => {
  it("names the types whose answer is a chosen option", () => {
    expect(
      QUESTIONNAIRE_FIELD_TYPE_VALUES.filter(isQuestionnaireChoiceAnswerType),
    ).toEqual(["choice", "multi_choice", "yes_no"]);
  });
});
