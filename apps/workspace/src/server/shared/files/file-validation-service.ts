import "server-only";
import type { StorageAdapter } from "@invessiv/common/contracts/storage/storage-adapter";
import type { FileValidationInput } from "@invessiv/common/contracts/files/file-validation-input";
import type { FileValidationResult } from "@invessiv/common/contracts/files/file-validation-result";
import type { FileInspectionAdapter } from "@invessiv/common/contracts/files/file-inspection-adapter";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { classifyUploadCandidate } from "@invessiv/common/patterns/files/classify-upload-candidate";
import { matchesFileSignature } from "@invessiv/common/patterns/files/file-signature";
import { fileInspectionService } from "./file-inspection-service";
import { officeValidationService } from "./office-validation-service";
import { svgValidationService } from "./svg-validation-service";

async function validate(
  storage: StorageAdapter,
  input: FileValidationInput,
  inspector: FileInspectionAdapter = fileInspectionService,
): Promise<FileValidationResult> {
  const candidate = classifyUploadCandidate({
    name: "file." + input.extension,
    size: input.sizeBytes,
  });
  if (!candidate.ok) return candidate;
  const metadata = await storage.head(input.storageKey);
  if (!metadata) return { ok: false, code: FileErrorCode.MissingObject };
  if (metadata.size > candidate.maxBytes)
    return { ok: false, code: FileErrorCode.TooLarge };
  if (metadata.size !== input.sizeBytes)
    return { ok: false, code: FileErrorCode.SizeMismatch };
  if (metadata.contentType !== candidate.contentType)
    return { ok: false, code: FileErrorCode.ContentTypeMismatch };
  const end = Math.min(metadata.size, 65_536) - 1;
  const prefix = await storage.readRange(input.storageKey, 0, end);
  if (input.extension === UploadExtension.Svg) {
    const whole =
      metadata.size === prefix.length
        ? prefix
        : await storage.readRange(input.storageKey, 0, metadata.size - 1);
    if (!svgValidationService.validate(whole))
      return { ok: false, code: FileErrorCode.UnsafeSvg };
  } else if (
    input.extension === UploadExtension.Txt ||
    input.extension === UploadExtension.Csv
  ) {
    // Streaming decoding checks the entire text, including split UTF-8 sequences and late NUL bytes.
    const reader = (await storage.openReadStream(input.storageKey)).getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > input.sizeBytes || value.includes(0))
          return { ok: false, code: FileErrorCode.InvalidSignature };
        try {
          decoder.decode(value, { stream: true });
        } catch {
          return { ok: false, code: FileErrorCode.InvalidSignature };
        }
      }
      try {
        decoder.decode();
      } catch {
        return { ok: false, code: FileErrorCode.InvalidSignature };
      }
      if (total !== input.sizeBytes)
        return { ok: false, code: FileErrorCode.SizeMismatch };
    } finally {
      await reader.cancel();
      reader.releaseLock();
    }
  } else {
    if (!matchesFileSignature(prefix, input.extension))
      return { ok: false, code: FileErrorCode.InvalidSignature };
    if (
      [UploadExtension.Docx, UploadExtension.Xlsx, UploadExtension.Pptx].some(
        (extension) => extension === input.extension,
      ) &&
      !(await officeValidationService.validate(
        storage,
        input.storageKey,
        metadata.size,
        input.extension,
      ))
    )
      return { ok: false, code: FileErrorCode.InvalidOffice };
  }
  return inspector.inspect(input);
}

export const fileValidationService = { validate };
