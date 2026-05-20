import type { LeadImportRowIssueDto } from "@invessiv/common/contracts/leads";

export interface LeadImportReportDto {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  warningCount: number;
  ignoredColumns: string[];
  rowIssues: LeadImportRowIssueDto[];
  importBatchId: string;
}
