export const LeadImportErrorCode = {
  FileTooLarge: "file_too_large",
  UnsupportedMediaType: "unsupported_media_type",
  EmptyFile: "empty_file",
  InvalidCsv: "invalid_csv",
  TooManyRows: "too_many_rows",
  ValidationFailed: "validation_failed",
  Internal: "internal",
} as const;

export type LeadImportErrorCode =
  (typeof LeadImportErrorCode)[keyof typeof LeadImportErrorCode];

export const LEAD_IMPORT_ERROR_CODE_VALUES = [
  LeadImportErrorCode.FileTooLarge,
  LeadImportErrorCode.UnsupportedMediaType,
  LeadImportErrorCode.EmptyFile,
  LeadImportErrorCode.InvalidCsv,
  LeadImportErrorCode.TooManyRows,
  LeadImportErrorCode.ValidationFailed,
  LeadImportErrorCode.Internal,
] as const;
