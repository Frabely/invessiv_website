import { describe, expect, it } from "vitest";
import {
  LEAD_IMPORT_COLUMN_KEY_VALUES,
  LeadImportColumnKey,
} from "@/common/constants/leads/import/columns/lead-import-column-keys";

describe("LeadImportColumnKey", () => {
  it("contains the expected CSV column keys without duplicates", () => {
    expect(LEAD_IMPORT_COLUMN_KEY_VALUES).toEqual([
      LeadImportColumnKey.DisplayName,
      LeadImportColumnKey.Email,
      LeadImportColumnKey.FirstName,
      LeadImportColumnKey.LastName,
      LeadImportColumnKey.CompanyName,
      LeadImportColumnKey.Phone,
      LeadImportColumnKey.Owner,
      LeadImportColumnKey.Notes,
      LeadImportColumnKey.ExternalGuid,
      LeadImportColumnKey.WebsiteUrl,
      LeadImportColumnKey.LinkedinUrl,
      LeadImportColumnKey.InstagramUrl,
      LeadImportColumnKey.YoutubeUrl,
      LeadImportColumnKey.Category,
      LeadImportColumnKey.CategoryId,
      LeadImportColumnKey.Score,
      LeadImportColumnKey.Status,
      LeadImportColumnKey.Improvements,
    ]);

    expect(new Set(LEAD_IMPORT_COLUMN_KEY_VALUES).size).toBe(
      LEAD_IMPORT_COLUMN_KEY_VALUES.length,
    );
  });
});
