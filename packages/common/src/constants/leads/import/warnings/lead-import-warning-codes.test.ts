import { describe, expect, it } from "vitest";
import {
  LEAD_IMPORT_WARNING_CODE_VALUES,
  LeadImportWarningCode,
} from "@invessiv/common/constants/leads/import/warnings/lead-import-warning-codes";

describe("LeadImportWarningCode", () => {
  it("contains the expected import warning codes without duplicates", () => {
    expect(LEAD_IMPORT_WARNING_CODE_VALUES).toEqual([
      LeadImportWarningCode.IgnoredColumn,
      LeadImportWarningCode.UnknownStatusFallback,
      LeadImportWarningCode.EmptyImprovementToken,
    ]);

    expect(new Set(LEAD_IMPORT_WARNING_CODE_VALUES).size).toBe(
      LEAD_IMPORT_WARNING_CODE_VALUES.length,
    );
  });
});
