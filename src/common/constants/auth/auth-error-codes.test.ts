import { describe, expect, it } from "vitest";
import {
  AUTH_ERROR_CODE_VALUES,
  AuthErrorCode,
} from "@/common/constants/auth/auth-error-codes";

describe("AuthErrorCode", () => {
  it("exports the expected values without duplicates", () => {
    expect(AUTH_ERROR_CODE_VALUES).toEqual([
      AuthErrorCode.NotFound,
      AuthErrorCode.Unauthorized,
    ]);
    expect(new Set(AUTH_ERROR_CODE_VALUES).size).toBe(
      AUTH_ERROR_CODE_VALUES.length,
    );
  });
});
