import { describe, expect, it } from "vitest";
import {
  LEAD_IMPORT_ERROR_CODE_VALUES,
  LeadImportErrorCode,
} from "@/common/constants/leads/lead-import-error-codes";

describe("LeadImportErrorCode", () => {
  it("contains the expected import error codes without duplicates", () => {
    expect(LEAD_IMPORT_ERROR_CODE_VALUES).toEqual([
      LeadImportErrorCode.FileTooLarge,
      LeadImportErrorCode.UnsupportedMediaType,
      LeadImportErrorCode.EmptyFile,
      LeadImportErrorCode.InvalidCsv,
      LeadImportErrorCode.TooManyRows,
      LeadImportErrorCode.ValidationFailed,
      LeadImportErrorCode.Internal,
    ]);

    expect(new Set(LEAD_IMPORT_ERROR_CODE_VALUES).size).toBe(
      LEAD_IMPORT_ERROR_CODE_VALUES.length,
    );
  });
});
