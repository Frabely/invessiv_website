import type { FileValidationInput } from "./file-validation-input";
import type { FileValidationResult } from "./file-validation-result";

export interface FileInspectionAdapter {
  inspect(input: FileValidationInput): Promise<FileValidationResult>;
}
