import "server-only";
import type { StorageAdapter } from "@invessiv/common/contracts/storage/storage-adapter";
import type { UploadExtension } from "@invessiv/common/constants/files/upload-extension";

const mainParts: Partial<Record<UploadExtension, string>> = {
  docx: "word/document.xml",
  xlsx: "xl/workbook.xml",
  pptx: "ppt/presentation.xml",
};

async function validate(
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
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) {
    if (
      view.getUint32(i, true) === 0x06054b50 &&
      i + 22 + view.getUint16(i + 20, true) === tail.length
    ) {
      eocd = i;
      break;
    }
  }
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
        uncompressedSize === 0xffffffff ||
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
      offset = end;
    }
  } catch {
    return false;
  }
  return (
    offset === bytes.length &&
    names.has("[content_types].xml") &&
    names.has(mainPart)
  );
}

export const officeValidationService = { validate };
