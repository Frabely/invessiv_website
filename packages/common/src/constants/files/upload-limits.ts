import { AssetKind } from "./asset-kind";

const MB = 1_000_000;
export const UPLOAD_LIMIT_BY_KIND = {
  [AssetKind.Document]: {
    pdf: 100 * MB,
    pptx: 100 * MB,
    docx: 50 * MB,
    xlsx: 50 * MB,
    txt: 10 * MB,
    csv: 10 * MB,
  },
  [AssetKind.Image]: {
    png: 40 * MB,
    jpg: 40 * MB,
    jpeg: 40 * MB,
    webp: 40 * MB,
    heic: 40 * MB,
    heif: 40 * MB,
    svg: 5 * MB,
  },
  [AssetKind.Video]: { mp4: 200 * MB, mov: 200 * MB, webm: 200 * MB },
  [AssetKind.Font]: { otf: 10 * MB, ttf: 10 * MB, woff2: 10 * MB },
} as const;
export const MAX_UPLOAD_FILES = 20;
export const MAX_UPLOAD_BATCH_BYTES = 1_000 * MB;
// Not consumed until the Task 53 lightbox: above this, TXT/CSV render as a
// download instead of plaintext (see 14-dateien/README.md, format table).
export const MAX_TEXT_PREVIEW_BYTES = MB;
export const UPLOAD_URL_TTL_MS = 10 * 60_000;
export const DOWNLOAD_URL_TTL_MS = 5 * 60_000;
export const MAX_SAFE_FILENAME_BYTES = 180;
