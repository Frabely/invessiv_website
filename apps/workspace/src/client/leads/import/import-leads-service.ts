import { LeadImportErrorCode } from "@invessiv/common/constants/leads/import/errors/lead-import-error-codes";
import type { LeadImportReportDto } from "@invessiv/common/contracts/leads/import/lead-import-report.dto";
import type { LeadImportResultDto } from "@invessiv/common/contracts/leads/import/lead-import-result.dto";

import {
  ImportLeadReportField,
  ImportLeadServiceValue,
} from "@invessiv/common/constants/leads/import/service/import-leads-service.constants";

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
    ImportLeadReportField.ImportedCount in value &&
    typeof (value as Record<string, unknown>)[
      ImportLeadReportField.ImportedCount
    ] === "number" &&
    ImportLeadReportField.SkippedCount in value &&
    ImportLeadReportField.ErrorCount in value &&
    ImportLeadReportField.WarningCount in value &&
    Array.isArray(
      (value as Record<string, unknown>)[ImportLeadReportField.IgnoredColumns],
    ) &&
    Array.isArray(
      (value as Record<string, unknown>)[ImportLeadReportField.RowIssues],
    )
  );
}

async function submitImport(file: File): Promise<LeadImportResultDto> {
  const formData = new FormData();
  formData.append(ImportLeadServiceValue.FileField, file);

  let response: Response;
  try {
    response = await fetch(ImportLeadServiceValue.ApiPath, {
      method: ImportLeadServiceValue.HttpMethodPost,
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
      ImportLeadServiceValue.ReportField in payload &&
      isLeadImportReportShape(
        (payload as Record<string, unknown>)[
          ImportLeadServiceValue.ReportField
        ],
      )
    ) {
      return {
        ok: true,
        report: (payload as Record<string, unknown>)[
          ImportLeadServiceValue.ReportField
        ] as LeadImportReportDto,
      };
    }
    return { ok: false, error: LeadImportErrorCode.Internal };
  }

  if (isObjectWithStringField(payload, ImportLeadServiceValue.ErrorField)) {
    return {
      ok: false,
      error: (payload as Record<string, unknown>)[
        ImportLeadServiceValue.ErrorField
      ] as LeadImportErrorCode,
    };
  }

  return { ok: false, error: LeadImportErrorCode.Internal };
}

export const importLeadsService = {
  submitImport,
} as const;
