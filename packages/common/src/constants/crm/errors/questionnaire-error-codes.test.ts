import { describe, expect, it } from "vitest";
import {
  QUESTIONNAIRE_ERROR_CODE_VALUES,
  QuestionnaireErrorCode,
} from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";

describe("QUESTIONNAIRE_ERROR_CODE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...QUESTIONNAIRE_ERROR_CODE_VALUES]).toEqual(
      Object.values(QuestionnaireErrorCode),
    );
  });

  it("contains no duplicates", () => {
    expect(new Set(QUESTIONNAIRE_ERROR_CODE_VALUES).size).toBe(
      QUESTIONNAIRE_ERROR_CODE_VALUES.length,
    );
  });
});
