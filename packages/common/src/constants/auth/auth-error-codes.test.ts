import { describe, expect, it } from "vitest";
import {
  AUTH_ERROR_CODE_VALUES,
  AuthErrorCode,
} from "@invessiv/common/constants/auth/auth-error-codes";

describe("AuthErrorCode", () => {
  it("exports the expected values without duplicates", () => {
    expect(AUTH_ERROR_CODE_VALUES).toEqual([
      AuthErrorCode.NotFound,
      AuthErrorCode.Unauthorized,
      AuthErrorCode.Forbidden,
      AuthErrorCode.Unavailable,
    ]);
    expect(AUTH_ERROR_CODE_VALUES).toEqual(Object.values(AuthErrorCode));
    expect(new Set(AUTH_ERROR_CODE_VALUES).size).toBe(
      AUTH_ERROR_CODE_VALUES.length,
    );
  });
});
