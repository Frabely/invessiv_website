import { describe, expect, it } from "vitest";

import {
  ImportLeadReportField,
  ImportLeadServiceValue,
} from "@invessiv/common";

describe("ImportLeadServiceValue", () => {
  it("exposes the expected client import constants", () => {
    expect(ImportLeadServiceValue).toEqual({
      FileField: "file",
      HttpMethodPost: "POST",
      ReportField: "report",
      ErrorField: "error",
    });

    expect(new Set(Object.values(ImportLeadServiceValue)).size).toBe(
      Object.keys(ImportLeadServiceValue).length,
    );
  });
});

describe("ImportLeadReportField", () => {
  it("exposes the expected report field constants", () => {
    expect(ImportLeadReportField).toEqual({
      ImportedCount: "importedCount",
      SkippedCount: "skippedCount",
      ErrorCount: "errorCount",
      WarningCount: "warningCount",
      IgnoredColumns: "ignoredColumns",
      RowIssues: "rowIssues",
    });

    expect(new Set(Object.values(ImportLeadReportField)).size).toBe(
      Object.keys(ImportLeadReportField).length,
    );
  });
});
