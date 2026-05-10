import { LeadImportErrorCode } from "@/common/constants/leads/lead-import-error-codes";

const MESSAGES: Record<LeadImportErrorCode, string> = {
  [LeadImportErrorCode.FileTooLarge]: "File exceeds the 2 MB size limit",
  [LeadImportErrorCode.UnsupportedMediaType]: "Only CSV files are accepted",
  [LeadImportErrorCode.EmptyFile]: "No file provided or file is empty",
  [LeadImportErrorCode.InvalidCsv]: "File could not be parsed as a valid CSV",
  [LeadImportErrorCode.TooManyRows]: "File exceeds the 500-row import limit",
  [LeadImportErrorCode.ValidationFailed]: "Import validation failed",
  [LeadImportErrorCode.Internal]: "Unexpected server error during import",
};

export function leadImportApiError(
  code: LeadImportErrorCode,
  status: number,
  details?: unknown,
): Response {
  return Response.json(
    {
      error: code,
      message: MESSAGES[code],
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  );
}
