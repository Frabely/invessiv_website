import { describe, expect, it } from "vitest";
import {
  LEAD_CONVERSION_ERROR_CODE_VALUES,
  LeadConversionErrorCode,
} from "./lead-conversion-error-codes";

describe("lead conversion error codes", () => {
  it("contains the exact unique public values", () => {
    expect(LEAD_CONVERSION_ERROR_CODE_VALUES).toEqual([
      "LEAD_CONVERSION_DISPLAY_NAME_TAKEN",
      "LEAD_CONVERSION_INTERNAL",
      "LEAD_CONVERSION_LEAD_NOT_FOUND",
      "LEAD_CONVERSION_OWNER_INACTIVE",
      "LEAD_CONVERSION_VALIDATION_ERROR",
    ]);
    expect(new Set(LEAD_CONVERSION_ERROR_CODE_VALUES).size).toBe(
      LEAD_CONVERSION_ERROR_CODE_VALUES.length,
    );
    expect(LeadConversionErrorCode.LeadNotFound).toBe(
      "LEAD_CONVERSION_LEAD_NOT_FOUND",
    );
  });
});
