import type { LeadImportErrorCode } from "@/common/constants/leads/lead-import-error-codes";
import type { LeadImportReportDto } from "./lead-import-report.dto";

export type LeadImportResultDto =
  | { ok: true; report: LeadImportReportDto }
  | { ok: false; error: LeadImportErrorCode; details?: unknown };
