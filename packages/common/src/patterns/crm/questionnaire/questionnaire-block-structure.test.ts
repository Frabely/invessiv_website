import { describe, expect, it } from "vitest";
import { QuestionnaireCatalogStatus } from "../../../constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QuestionnaireFieldRequirement } from "../../../constants/crm/questionnaire/questionnaire-field-requirements";
import {
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "../../../constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireBlockDto } from "../../../contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "../../../contracts/crm/questionnaire/questionnaire-field.dto";
import {
  findQuestionnaireField,
  flattenQuestionnaireFields,
  questionnaireConditionCandidates,
  questionnaireFieldLevel,
  resolveQuestionnaireCondition,
} from "./questionnaire-block-structure";

function field(
  id: string,
  type: FieldType,
  position: number,
  children: QuestionnaireFieldDto[] = [],
  parentFieldId: string | null = null,
): QuestionnaireFieldDto {
  return {
    id,
    blockId: "b",
    parentFieldId,
    key: id,
    position,
    type,
    requirement: QuestionnaireFieldRequirement.Optional,
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: {},
    choices: [],
    children,
    version: 1,
  };
}

const T = QuestionnaireFieldType;
const block: QuestionnaireBlockDto = {
  id: "b",
  key: "block",
  carryOver: false,
  status: QuestionnaireCatalogStatus.Active,
  sourceBlockId: null,
  translations: {},
  version: 1,
  fields: [
    field("yes_no", T.YesNo, 0),
    field("text", T.ShortText, 1),
    field("group", T.Group, 2, [
      field("inner_choice", T.Choice, 0, [], "group"),
      field("inner_text", T.ShortText, 1, [], "group"),
    ]),
    field("choice", T.Choice, 3),
  ],
};

describe("questionnaire block structure", () => {
  it("flattens sub-fields right after their group", () => {
    expect(flattenQuestionnaireFields(block.fields).map((f) => f.id)).toEqual([
      "yes_no",
      "text",
      "group",
      "inner_choice",
      "inner_text",
      "choice",
    ]);
    expect(findQuestionnaireField(block, "inner_text")?.parentFieldId).toBe(
      "group",
    );
  });

  it("returns the level of a group or of the block", () => {
    expect(questionnaireFieldLevel(block, "group").map((f) => f.id)).toEqual([
      "inner_choice",
      "inner_text",
    ]);
    expect(questionnaireFieldLevel(block, "missing")).toEqual([]);
  });

  it("offers only choice triggers above the field on its own level", () => {
    const ids = (list: QuestionnaireFieldDto[]) => list.map((f) => f.id);
    expect(ids(questionnaireConditionCandidates(block, null, "text"))).toEqual([
      "yes_no",
    ]);
    expect(
      ids(questionnaireConditionCandidates(block, null, "yes_no")),
    ).toEqual([]);
    expect(ids(questionnaireConditionCandidates(block, null, null))).toEqual([
      "yes_no",
      "choice",
    ]);
    expect(
      ids(questionnaireConditionCandidates(block, "group", "inner_text")),
    ).toEqual(["inner_choice"]);
  });

  describe("resolveQuestionnaireCondition", () => {
    const choice = (id: string, position: number) => ({
      id,
      key: id,
      position,
      labels: {},
      version: 1,
    });
    const withChoices: QuestionnaireBlockDto = {
      ...block,
      fields: block.fields.map((candidate) =>
        candidate.id === "yes_no"
          ? { ...candidate, choices: [choice("yes", 0), choice("no", 1)] }
          : candidate,
      ),
    };

    it("keeps a condition on a trigger above the field", () => {
      expect(
        resolveQuestionnaireCondition(
          withChoices,
          null,
          "text",
          "yes_no",
          "no",
        ),
      ).toEqual({ conditionFieldId: "yes_no", conditionChoiceId: "no" });
    });

    it("drops a condition whose trigger is gone or no longer above the field", () => {
      expect(
        resolveQuestionnaireCondition(withChoices, null, "text", "gone", "no"),
      ).toEqual({ conditionFieldId: null, conditionChoiceId: null });
      expect(
        resolveQuestionnaireCondition(withChoices, null, "text", "choice", "x"),
      ).toEqual({ conditionFieldId: null, conditionChoiceId: null });
    });

    it("falls back to the first option when the chosen one is gone", () => {
      expect(
        resolveQuestionnaireCondition(
          withChoices,
          null,
          "text",
          "yes_no",
          "removed",
        ),
      ).toEqual({ conditionFieldId: "yes_no", conditionChoiceId: "yes" });
    });
  });
});
