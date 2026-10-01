import { describe, expect, it } from "vitest";

import { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { QuestionnairePrefillSource } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import { questionnaireDefinitionValidation } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-validation";
import {
  blockFixture,
  choicesFixture,
  fieldFixture,
} from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";

const { validateBlock } = questionnaireDefinitionValidation;
const T = QuestionnaireFieldType;

function yesNo(key: string) {
  return fieldFixture(key, T.YesNo, { choices: choicesFixture("yes", "no") });
}

function group(key: string, children: QuestionnaireFieldDto[]) {
  return fieldFixture(key, T.Group, {
    children: children.map((child, position) => ({
      ...child,
      parentFieldId: `f-${key}`,
      position,
    })),
  });
}

describe("questionnaireDefinitionValidation.validateBlock", () => {
  it("accepts a block that uses every rule correctly", () => {
    const block = blockFixture([
      yesNo("has_locations"),
      group("locations", [
        fieldFixture("name"),
        fieldFixture("hours", T.LongText, { maxLength: 500 }),
      ]),
      fieldFixture("company_name", T.ShortText, {
        prefillSource: QuestionnairePrefillSource.CustomerCompanyName,
      }),
      fieldFixture("logo", T.Files, {
        minItems: 1,
        maxItems: 5,
        acceptedAssetKinds: ["image"],
      }),
      fieldFixture("services", T.ProjectServices),
    ]);
    block.fields[1] = {
      ...block.fields[1]!,
      conditionFieldId: "f-has_locations",
      conditionChoiceId: "c-yes",
    };

    expect(validateBlock(block)).toBeNull();
  });

  describe("field configuration", () => {
    it.each([
      [
        "max length on a non-text type",
        fieldFixture("a", T.Email, { maxLength: 10 }),
      ],
      [
        "item counts on a text type",
        fieldFixture("a", T.ShortText, { minItems: 1 }),
      ],
      [
        "min items above max items",
        fieldFixture("a", T.Files, { minItems: 3, maxItems: 2 }),
      ],
      [
        "asset kinds outside a files field",
        fieldFixture("a", T.Url, { acceptedAssetKinds: ["image"] }),
      ],
      [
        "a prefill source for the wrong type",
        fieldFixture("a", T.LongText, {
          prefillSource: QuestionnairePrefillSource.CustomerCompanyName,
        }),
      ],
      [
        "a multi choice demanding more ticks than options",
        fieldFixture("a", T.MultiChoice, {
          minItems: 3,
          choices: choicesFixture("x", "y"),
        }),
      ],
    ])("rejects %s", (_, field) => {
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("rejects a files field above the files limit", () => {
      const field = fieldFixture("a", T.Files, {
        maxItems: QUESTIONNAIRE_LIMITS.filesPerField + 1,
      });
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.LimitReached,
      );
    });
  });

  describe("options", () => {
    it("requires at least two options for a choice", () => {
      const field = fieldFixture("a", T.Choice, {
        choices: choicesFixture("x"),
      });
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("requires exactly the fixed keys yes and no", () => {
      const field = fieldFixture("a", T.YesNo, {
        choices: choicesFixture("yes", "maybe"),
      });
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("requires exactly the fixed poles low and high", () => {
      const field = fieldFixture("a", T.Scale, {
        choices: choicesFixture("high", "low"),
      });
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("rejects options on a type without options", () => {
      const field = fieldFixture("a", T.Color, {
        choices: choicesFixture("x", "y"),
      });
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("rejects duplicate option keys", () => {
      const field = fieldFixture("a", T.Choice, {
        choices: choicesFixture("x", "x"),
      });
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("rejects more options than the limit", () => {
      const keys = Array.from(
        { length: QUESTIONNAIRE_LIMITS.choicesPerField + 1 },
        (_, index) => `o${index}`,
      );
      const field = fieldFixture("a", T.Choice, {
        choices: choicesFixture(...keys),
      });
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.LimitReached,
      );
    });
  });

  describe("conditions", () => {
    function dependent(overrides: Partial<QuestionnaireFieldDto>) {
      return fieldFixture("dependent", T.ShortText, {
        conditionFieldId: "f-trigger",
        conditionChoiceId: "c-yes",
        ...overrides,
      });
    }

    it("rejects a trigger in a later position", () => {
      const block = blockFixture([dependent({}), yesNo("trigger")]);
      expect(validateBlock(block)).toBe(
        QuestionnaireErrorCode.InvalidCondition,
      );
    });

    it("rejects a trigger on another level", () => {
      const block = blockFixture([
        group("people", [yesNo("trigger")]),
        dependent({}),
      ]);
      expect(validateBlock(block)).toBe(
        QuestionnaireErrorCode.InvalidCondition,
      );
    });

    it("rejects a trigger type that cannot answer with an option", () => {
      const block = blockFixture([
        fieldFixture("trigger", T.Scale, {
          choices: choicesFixture("low", "high"),
        }),
        dependent({ conditionChoiceId: "c-low" }),
      ]);
      expect(validateBlock(block)).toBe(
        QuestionnaireErrorCode.InvalidCondition,
      );
    });

    it("rejects an option of another field", () => {
      const block = blockFixture([
        yesNo("trigger"),
        fieldFixture("other", T.Choice, { choices: choicesFixture("x", "y") }),
        dependent({ conditionChoiceId: "c-x" }),
      ]);
      expect(validateBlock(block)).toBe(
        QuestionnaireErrorCode.InvalidCondition,
      );
    });

    it("rejects half a condition", () => {
      const block = blockFixture([
        yesNo("trigger"),
        dependent({ conditionChoiceId: null }),
      ]);
      expect(validateBlock(block)).toBe(
        QuestionnaireErrorCode.InvalidCondition,
      );
    });

    it("rejects a condition whose trigger is gone, as after deleting or moving it", () => {
      expect(validateBlock(blockFixture([dependent({})]))).toBe(
        QuestionnaireErrorCode.InvalidCondition,
      );
    });

    it("accepts a condition inside a group on the group's own trigger", () => {
      const block = blockFixture([
        group("people", [
          yesNo("trigger"),
          dependent({ parentFieldId: "f-people" }),
        ]),
      ]);
      expect(validateBlock(block)).toBeNull();
    });
  });

  describe("groups", () => {
    it("rejects a group inside a group", () => {
      const block = blockFixture([group("outer", [group("inner", [])])]);
      expect(validateBlock(block)).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("rejects the service confirmation inside a group", () => {
      const block = blockFixture([
        group("outer", [fieldFixture("services", T.ProjectServices)]),
      ]);
      expect(validateBlock(block)).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("rejects sub-fields below a type other than group", () => {
      const block = blockFixture([
        fieldFixture("text", T.ShortText, {
          children: [fieldFixture("child")],
        }),
      ]);
      expect(validateBlock(block)).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("rejects the service confirmation twice in one block", () => {
      const block = blockFixture([
        fieldFixture("services", T.ProjectServices),
        fieldFixture("services_again", T.ProjectServices),
      ]);
      expect(validateBlock(block)).toBe(
        QuestionnaireErrorCode.InvalidFieldConfig,
      );
    });

    it("rejects more sub-fields than the group limit", () => {
      const children = Array.from(
        { length: QUESTIONNAIRE_LIMITS.childFieldsPerGroup + 1 },
        (_, index) => fieldFixture(`child_${index}`),
      );
      expect(validateBlock(blockFixture([group("people", children)]))).toBe(
        QuestionnaireErrorCode.LimitReached,
      );
    });
  });

  describe("translations, keys and limits", () => {
    it("requires a text for the block", () => {
      expect(validateBlock(blockFixture([], { translations: {} }))).toBe(
        QuestionnaireErrorCode.TranslationRequired,
      );
    });

    it("requires a text for every field", () => {
      const field = fieldFixture("a", T.ShortText, { translations: {} });
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.TranslationRequired,
      );
    });

    it("requires a label for every option", () => {
      const field = fieldFixture("a", T.Choice, {
        choices: [
          ...choicesFixture("x"),
          { ...choicesFixture("y")[0]!, position: 1, labels: {} },
        ],
      });
      expect(validateBlock(blockFixture([field]))).toBe(
        QuestionnaireErrorCode.TranslationRequired,
      );
    });

    it("rejects a key used twice, also between block level and a group", () => {
      const block = blockFixture([
        fieldFixture("name"),
        group("people", [fieldFixture("name")]),
      ]);
      expect(validateBlock(block)).toBe(QuestionnaireErrorCode.KeyTaken);
    });

    it("rejects more fields than the block limit, sub-fields included", () => {
      const fields = Array.from(
        { length: QUESTIONNAIRE_LIMITS.fieldsPerBlock + 1 },
        (_, index) => fieldFixture(`field_${index}`),
      );
      expect(validateBlock(blockFixture(fields))).toBe(
        QuestionnaireErrorCode.LimitReached,
      );
    });
  });
});
