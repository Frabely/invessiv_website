import type { FileErrorCode } from "../../constants/files/file-error-code";
import type { FileInspectionStatus } from "../../constants/files/file-inspection-status";

export type FileValidationResult =
  | { ok: true; inspectionStatus: FileInspectionStatus }
  | { ok: false; code: FileErrorCode };
