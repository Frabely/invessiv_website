import { describe, expect, it } from "vitest";
import { LeadCsvSeparator } from "@/common/constants/leads/import/csv/lead-csv-separator";

describe("LeadCsvSeparator", () => {
  it("contains the expected separator values without duplicates", () => {
    expect(Object.values(LeadCsvSeparator)).toEqual([";", ","]);
    expect(new Set(Object.values(LeadCsvSeparator)).size).toBe(
      Object.values(LeadCsvSeparator).length,
    );
  });
});
