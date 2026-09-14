import { describe, expect, it } from "vitest";

import {
  ROLE_ERROR_CODE_VALUES,
  RoleErrorCode,
} from "@invessiv/common/constants/auth/errors/role-error-codes";

describe("ROLE_ERROR_CODE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...ROLE_ERROR_CODE_VALUES]).toEqual(Object.values(RoleErrorCode));
  });

  it("contains no duplicates", () => {
    expect(new Set(ROLE_ERROR_CODE_VALUES).size).toBe(
      ROLE_ERROR_CODE_VALUES.length,
    );
  });
});
