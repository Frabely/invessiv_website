import { describe, expect, it } from "vitest";
import {
  PROJECT_ERROR_CODE_VALUES,
  ProjectErrorCode,
} from "@invessiv/common/constants/crm/errors/project-error-codes";

describe("PROJECT_ERROR_CODE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...PROJECT_ERROR_CODE_VALUES]).toEqual(
      Object.values(ProjectErrorCode),
    );
  });

  it("contains no duplicates", () => {
    expect(new Set(PROJECT_ERROR_CODE_VALUES).size).toBe(
      PROJECT_ERROR_CODE_VALUES.length,
    );
  });
});
