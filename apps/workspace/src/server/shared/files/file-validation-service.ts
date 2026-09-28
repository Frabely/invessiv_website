import "server-only";
import { SaxesParser } from "saxes";
import type { StorageAdapter } from "@invessiv/common/contracts/storage/storage-adapter";
import type { FileValidationInput } from "@invessiv/common/contracts/files/file-validation-input";
import type { FileValidationResult } from "@invessiv/common/contracts/files/file-validation-result";
import type { FileInspectionAdapter } from "@invessiv/common/contracts/files/file-inspection-adapter";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import { classifyUploadCandidate } from "@invessiv/common/patterns/files/classify-upload-candidate";
import { matchesFileSignature } from "@invessiv/common/patterns/files/file-signature";
import { fileInspectionService } from "./file-inspection-service";

function safeCss(value: string): boolean {
  // Reject CSS escapes/comments/imports rather than attempting browser CSS recovery.
  if (
    /[\\@]/.test(value) ||
    value.includes("/*") ||
    /javascript\s*:/i.test(value)
  )
    return false;
  return !/url\s*\(/i.test(
    value.replace(/url\(\s*["']?#[a-z0-9_.:-]+["']?\s*\)/gi, ""),
  );
}

function validateSvg(bytes: Uint8Array): boolean {
  try {
    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (/<!ENTITY|<!DOCTYPE/i.test(source)) return false;
    let valid = true;
    let root = false;
    let depth = 0;
    let styleDepth = 0;
    let styleText = "";
    const parser = new SaxesParser({ xmlns: true });
    parser.on("error", () => {
      valid = false;
    });
    parser.on("doctype", () => {
      valid = false;
    });
    parser.on("processinginstruction", () => {
      valid = false;
    });
    parser.on("opentag", (tag) => {
      depth++;
      const name = tag.local.toLowerCase();
      if (!root) {
        root = true;
        if (
          name !== "svg" ||
          !["", "http://www.w3.org/2000/svg"].includes(tag.uri)
        )
          valid = false;
      }
      if (
        (tag.uri && tag.uri !== "http://www.w3.org/2000/svg") ||
        [
          "script",
          "foreignobject",
          "animate",
          "animatetransform",
          "animatemotion",
          "set",
          "discard",
        ].includes(name)
      )
        valid = false;
      if (name === "style") {
        styleDepth = depth;
        styleText = "";
      }
      for (const attr of Object.values(tag.attributes)) {
        const local = attr.local.toLowerCase();
        const value = attr.value.trim();
        if (
          local.startsWith("on") ||
          value.includes("\\") ||
          /javascript\s*:/i.test(value) ||
          local === "base" ||
          (["href", "src"].includes(local) && !/^#\S+$/.test(value)) ||
          (local === "style" && !safeCss(value)) ||
          (/url\s*\(/i.test(value) && !safeCss(value))
        )
          valid = false;
      }
    });
    const checkText = (text: string) => {
      if (styleDepth) styleText += text;
    };
    parser.on("text", checkText);
    parser.on("cdata", checkText);
    parser.on("closetag", () => {
      if (styleDepth === depth) {
        if (!safeCss(styleText)) valid = false;
        styleDepth = 0;
      }
      depth--;
    });
    parser.write(source).close();
    return root && valid && depth === 0;
  } catch {
    return false;
  }
}

const mainParts: Partial<Record<UploadExtension, string>> = {
  docx: "word/document.xml",
  xlsx: "xl/workbook.xml",
  pptx: "ppt/presentation.xml",
};

function findEndOfCentralDirectory(view: DataView): number {
  for (let offset = view.byteLength - 22; offset >= 0; offset--) {
    if (
      view.getUint32(offset, true) === 0x06054b50 &&
      offset + 22 + view.getUint16(offset + 20, true) === view.byteLength
    )
      return offset;
  }
  return -1;
}

async function matchesLocalOfficeHeader(
  storage: StorageAdapter,
  key: string,
  offset: number,
  directoryOffset: number,
  name: Uint8Array,
  flags: number,
  compression: number,
  compressedSize: number,
  uncompressedSize: number,
): Promise<boolean> {
  const end = offset + 30 + name.length - 1;
  if (end >= directoryOffset) return false;
  const bytes = await storage.readRange(key, offset, end);
  const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const extraLength = header.getUint16(28, true);
  if (
    header.getUint32(0, true) !== 0x04034b50 ||
    header.getUint16(6, true) !== flags ||
    header.getUint16(8, true) !== compression ||
    header.getUint16(26, true) !== name.length ||
    offset + 30 + name.length + extraLength + compressedSize >
      directoryOffset ||
    (!(flags & 0x08) &&
      (header.getUint32(18, true) !== compressedSize ||
        header.getUint32(22, true) !== uncompressedSize))
  )
    return false;
  return name.every((byte, index) => byte === bytes[30 + index]);
}

async function validateOffice(
  storage: StorageAdapter,
  key: string,
  size: number,
  extension: UploadExtension,
): Promise<boolean> {
  const mainPart = mainParts[extension];
  if (!mainPart || size < 22) return false;
  const tailStart = Math.max(0, size - 65_557);
  const tail = await storage.readRange(key, tailStart, size - 1);
  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  const eocd = findEndOfCentralDirectory(view);
  if (eocd < 0) return false;
  const entries = view.getUint16(eocd + 10, true);
  const directorySize = view.getUint32(eocd + 12, true);
  const directoryOffset = view.getUint32(eocd + 16, true);
  // Fail closed for split archives, ZIP64 and unbounded metadata. Nothing is decompressed.
  if (
    view.getUint16(eocd + 4, true) ||
    view.getUint16(eocd + 6, true) ||
    view.getUint16(eocd + 8, true) !== entries ||
    !entries ||
    entries > 10_000 ||
    !directorySize ||
    directorySize > 4_000_000 ||
    directoryOffset + directorySize !== tailStart + eocd
  )
    return false;
  const bytes = await storage.readRange(
    key,
    directoryOffset,
    directoryOffset + directorySize - 1,
  );
  const directory = new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  );
  const names = new Set<string>();
  const requiredHeaders: Array<{
    name: Uint8Array;
    offset: number;
    flags: number;
    compression: number;
    compressedSize: number;
    uncompressedSize: number;
  }> = [];
  let offset = 0;
  try {
    for (let i = 0; i < entries; i++) {
      if (
        offset + 46 > bytes.length ||
        directory.getUint32(offset, true) !== 0x02014b50
      )
        return false;
      const flags = directory.getUint16(offset + 8, true);
      const compression = directory.getUint16(offset + 10, true);
      const compressedSize = directory.getUint32(offset + 20, true);
      const uncompressedSize = directory.getUint32(offset + 24, true);
      const nameLength = directory.getUint16(offset + 28, true);
      const extraLength = directory.getUint16(offset + 30, true);
      const commentLength = directory.getUint16(offset + 32, true);
      const localOffset = directory.getUint32(offset + 42, true);
      const end = offset + 46 + nameLength + extraLength + commentLength;
      if (
        flags & 0x41 ||
        ![0, 8].includes(compression) ||
        !nameLength ||
        end > bytes.length ||
        directory.getUint16(offset + 34, true) ||
        compressedSize === 0xffffffff ||
        uncompressedSize === 0xffffffff ||
        localOffset === 0xffffffff ||
        localOffset + 30 + nameLength + compressedSize > directoryOffset
      )
        return false;
      const name = new TextDecoder("utf-8", { fatal: true }).decode(
        bytes.slice(offset + 46, offset + 46 + nameLength),
      );
      const normalized = name.toLowerCase();
      if (
        names.has(normalized) ||
        name.includes("\\") ||
        name.startsWith("/") ||
        name.includes("\0") ||
        name.split("/").includes("..") ||
        normalized.split("/").pop() === "vbaproject.bin"
      )
        return false;
      names.add(normalized);
      if (normalized === "[content_types].xml" || normalized === mainPart)
        requiredHeaders.push({
          name: bytes.slice(offset + 46, offset + 46 + nameLength),
          offset: localOffset,
          flags,
          compression,
          compressedSize,
          uncompressedSize,
        });
      offset = end;
    }
  } catch {
    return false;
  }
  if (offset !== bytes.length || requiredHeaders.length !== 2) return false;
  for (const header of requiredHeaders) {
    if (
      !(await matchesLocalOfficeHeader(
        storage,
        key,
        header.offset,
        directoryOffset,
        header.name,
        header.flags,
        header.compression,
        header.compressedSize,
        header.uncompressedSize,
      ))
    )
      return false;
  }
  return true;
}

async function validateText(
  storage: StorageAdapter,
  input: FileValidationInput,
): Promise<FileValidationResult | null> {
  // Streaming catches malformed UTF-8, split sequences and late NUL bytes.
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
    return total === input.sizeBytes
      ? null
      : { ok: false, code: FileErrorCode.SizeMismatch };
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
}

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
    if (!validateSvg(whole))
      return { ok: false, code: FileErrorCode.UnsafeSvg };
  } else if (
    input.extension === UploadExtension.Txt ||
    input.extension === UploadExtension.Csv
  ) {
    const invalid = await validateText(storage, input);
    if (invalid) return invalid;
  } else {
    if (!matchesFileSignature(prefix, input.extension))
      return { ok: false, code: FileErrorCode.InvalidSignature };
    if (
      [UploadExtension.Docx, UploadExtension.Xlsx, UploadExtension.Pptx].some(
        (extension) => extension === input.extension,
      ) &&
      !(await validateOffice(
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
