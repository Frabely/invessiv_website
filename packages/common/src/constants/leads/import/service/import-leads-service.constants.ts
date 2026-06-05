export const ImportLeadServiceValue = {
  FileField: "file",
  HttpMethodPost: "POST",
  ReportField: "report",
  ErrorField: "error",
} as const;

export const ImportLeadReportField = {
  ImportedCount: "importedCount",
  SkippedCount: "skippedCount",
  ErrorCount: "errorCount",
  WarningCount: "warningCount",
  IgnoredColumns: "ignoredColumns",
  RowIssues: "rowIssues",
} as const;
