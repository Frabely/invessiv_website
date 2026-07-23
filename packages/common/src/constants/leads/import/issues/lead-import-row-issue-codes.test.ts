import { describe, expect, it } from "vitest";
import {
  LEAD_IMPORT_ROW_ISSUE_CODE_VALUES,
  LeadImportRowIssueCode,
} from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-codes";

describe("LeadImportRowIssueCode", () => {
  it("contains the expected row issue codes without duplicates", () => {
    expect(LEAD_IMPORT_ROW_ISSUE_CODE_VALUES).toEqual([
      LeadImportRowIssueCode.MissingEmail,
      LeadImportRowIssueCode.MissingDisplayName,
      LeadImportRowIssueCode.InvalidEmail,
      LeadImportRowIssueCode.InvalidUrl,
      LeadImportRowIssueCode.InvalidScore,
      LeadImportRowIssueCode.InvalidExternalGuid,
      LeadImportRowIssueCode.UnknownCategoryId,
      LeadImportRowIssueCode.DuplicateEmailInFile,
      LeadImportRowIssueCode.DuplicateExternalGuidInFile,
      LeadImportRowIssueCode.DuplicateEmail,
      LeadImportRowIssueCode.DuplicateCompanyName,
      LeadImportRowIssueCode.DuplicateExternalGuid,
      LeadImportRowIssueCode.DuplicateSocialProfile,
      LeadImportRowIssueCode.ConflictEmailGuidMismatch,
    ]);

    expect(new Set(LEAD_IMPORT_ROW_ISSUE_CODE_VALUES).size).toBe(
      LEAD_IMPORT_ROW_ISSUE_CODE_VALUES.length,
    );
  });
});
