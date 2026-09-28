export const FileErrorCode = {
  UnsupportedExtension: "UNSUPPORTED_EXTENSION",
  InvalidSize: "INVALID_SIZE",
  TooLarge: "FILE_TOO_LARGE",
  TooManyFiles: "TOO_MANY_FILES",
  BatchTooLarge: "BATCH_TOO_LARGE",
  MissingObject: "MISSING_OBJECT",
  SizeMismatch: "SIZE_MISMATCH",
  ContentTypeMismatch: "CONTENT_TYPE_MISMATCH",
  InvalidSignature: "INVALID_SIGNATURE",
  UnsafeSvg: "UNSAFE_SVG",
  InvalidOffice: "INVALID_OFFICE",
  InvalidLink: "INVALID_LINK",
} as const;
export type FileErrorCode = (typeof FileErrorCode)[keyof typeof FileErrorCode];
