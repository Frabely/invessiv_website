import { describe, expect, it } from "vitest";
import {
  CONCURRENCY_ERROR_CODE_VALUES,
  ConcurrencyErrorCode,
} from "@invessiv/common/constants/errors/concurrency-error-codes";

describe("CONCURRENCY_ERROR_CODE_VALUES", () => {
  it("contains exactly the values of the const object", () => {
    expect([...CONCURRENCY_ERROR_CODE_VALUES]).toEqual(
      Object.values(ConcurrencyErrorCode),
    );
  });

  it("contains no duplicates", () => {
    expect(new Set(CONCURRENCY_ERROR_CODE_VALUES).size).toBe(
      CONCURRENCY_ERROR_CODE_VALUES.length,
    );
  });
});
