import { LeadImportErrorCode } from "@/common/constants/leads/import/lead-import-error-codes";
import type { LeadImportReportDto } from "@/common/contracts/leads/import/lead-import-report.dto";
import type { LeadImportResultDto } from "@/common/contracts/leads/import/lead-import-result.dto";

const IMPORT_API_PATH = "/api/workspace/leads/import";

function isObjectWithStringField(
  value: unknown,
  field: string,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    field in value &&
    typeof (value as Record<string, unknown>)[field] === "string"
  );
}

function isLeadImportReportShape(value: unknown): value is LeadImportReportDto {
  return (
    typeof value === "object" &&
    value !== null &&
    "importedCount" in value &&
    typeof (value as Record<string, unknown>).importedCount === "number" &&
    "skippedCount" in value &&
    "errorCount" in value &&
    "warningCount" in value &&
    Array.isArray((value as Record<string, unknown>).ignoredColumns) &&
    Array.isArray((value as Record<string, unknown>).rowIssues)
  );
}

export async function submitLeadImport(
  file: File,
): Promise<LeadImportResultDto> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(IMPORT_API_PATH, {
      method: "POST",
      body: formData,
    });
  } catch {
    return { ok: false, error: LeadImportErrorCode.Internal };
  }

  const payload = await response.json().catch(() => null);

  if (response.ok) {
    if (
      typeof payload === "object" &&
      payload !== null &&
      "report" in payload &&
      isLeadImportReportShape((payload as Record<string, unknown>).report)
    ) {
      return {
        ok: true,
        report: (payload as Record<string, unknown>)
          .report as LeadImportReportDto,
      };
    }
    return { ok: false, error: LeadImportErrorCode.Internal };
  }

  if (isObjectWithStringField(payload, "error")) {
    return {
      ok: false,
      error: (payload as Record<string, unknown>).error as LeadImportErrorCode,
    };
  }

  return { ok: false, error: LeadImportErrorCode.Internal };
}
