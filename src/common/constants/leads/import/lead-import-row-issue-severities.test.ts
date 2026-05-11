import { describe, expect, it } from "vitest";
import {
  LEAD_IMPORT_ROW_ISSUE_SEVERITY_VALUES,
  LeadImportRowIssueSeverity,
} from "@/common/constants/leads/import/lead-import-row-issue-severities";

describe("LeadImportRowIssueSeverity", () => {
  it("contains the expected severity values without duplicates", () => {
    expect(LEAD_IMPORT_ROW_ISSUE_SEVERITY_VALUES).toEqual([
      LeadImportRowIssueSeverity.Error,
      LeadImportRowIssueSeverity.Warning,
      LeadImportRowIssueSeverity.Skip,
    ]);

    expect(new Set(LEAD_IMPORT_ROW_ISSUE_SEVERITY_VALUES).size).toBe(
      LEAD_IMPORT_ROW_ISSUE_SEVERITY_VALUES.length,
    );
  });
});
