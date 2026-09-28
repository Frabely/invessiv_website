import { FilePreviewKind } from "../../constants/files/file-preview-kind";
import { FileSource } from "../../constants/files/file-source";
import { MAX_TEXT_PREVIEW_BYTES } from "../../constants/files/upload-limits";
import type { UploadExtension } from "../../constants/files/upload-extension";
import type { FileDto } from "../../contracts/files/file.dto";
import { parseHttpUrl } from "../url/parse-http-url";

// HEIC, MOV, Office and fonts render in too few browsers; they stay download-only.
const PREVIEW_KIND_BY_EXTENSION: Partial<
  Record<UploadExtension, FilePreviewKind>
> = {
  png: FilePreviewKind.Image,
  jpg: FilePreviewKind.Image,
  jpeg: FilePreviewKind.Image,
  webp: FilePreviewKind.Image,
  svg: FilePreviewKind.Image,
  pdf: FilePreviewKind.Pdf,
  txt: FilePreviewKind.Text,
  csv: FilePreviewKind.Text,
  mp4: FilePreviewKind.Video,
  webm: FilePreviewKind.Video,
};

/** How the lightbox shows a file, or null when it can only be downloaded. */
function previewKindOf(
  file: Pick<FileDto, "source" | "extension" | "sizeBytes">,
): FilePreviewKind | null {
  if (file.source !== FileSource.Upload || !file.extension) return null;
  const kind = PREVIEW_KIND_BY_EXTENSION[file.extension] ?? null;
  if (
    kind === FilePreviewKind.Text &&
    (file.sizeBytes ?? Number.POSITIVE_INFINITY) > MAX_TEXT_PREVIEW_BYTES
  )
    return null;
  return kind;
}

/** Decimal units, matching how the upload limits are stated. */
const SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

function formatSize(bytes: number, locale: string): string {
  let value = bytes;
  let index = 0;
  while (value >= 1000 && index < SIZE_UNITS.length - 1) {
    value /= 1000;
    index += 1;
  }
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: SIZE_UNITS[index],
    unitDisplay: "short",
    maximumFractionDigits: index === 0 || value >= 100 ? 0 : 1,
  }).format(value);
}

/** The domain shown next to a link; the server never fetches the target. */
function linkHost(url: string): string | null {
  return parseHttpUrl(url)?.hostname.replace(/^www\./u, "") ?? null;
}

export const filePresentation = { previewKindOf, formatSize, linkHost };
