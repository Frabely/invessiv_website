import type { UploadExtension } from "../../constants/files/upload-extension";

export interface FileValidationInput {
  storageKey: string;
  extension: UploadExtension;
  sizeBytes: number;
}
