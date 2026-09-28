import { describe, expect, it } from "vitest";
import { ASSET_KIND_VALUES, AssetKind } from "./asset-kind";
import { UPLOAD_EXTENSION_VALUES, UploadExtension } from "./upload-extension";
import { UPLOAD_CONTENT_TYPES } from "./upload-content-types";
import {
  DOWNLOAD_URL_TTL_MS,
  MAX_TEXT_PREVIEW_BYTES,
  MAX_UPLOAD_BATCH_BYTES,
  MAX_UPLOAD_FILES,
  UPLOAD_LIMIT_BY_KIND,
  UPLOAD_URL_TTL_MS,
} from "./upload-limits";
import { FILE_INSPECTION_STATUS_VALUES } from "./file-inspection-status";
import { FileErrorCode } from "./file-error-code";
import {
  StorageDisposition,
  StorageProvider,
} from "../storage/storage-options";
import { StorageErrorCode } from "../storage/storage-error-code";

describe("file constants", () => {
  it("defines the exact format policy without duplicates", () => {
    expect(ASSET_KIND_VALUES).toEqual([
      "document",
      "image",
      "video",
      "font",
      "link",
    ]);
    expect(UPLOAD_EXTENSION_VALUES).toEqual([
      "pdf",
      "pptx",
      "docx",
      "xlsx",
      "txt",
      "csv",
      "png",
      "jpg",
      "jpeg",
      "webp",
      "heic",
      "heif",
      "svg",
      "mp4",
      "mov",
      "webm",
      "otf",
      "ttf",
      "woff2",
    ]);
    expect(Object.keys(UPLOAD_CONTENT_TYPES)).toEqual(UPLOAD_EXTENSION_VALUES);
    expect(UPLOAD_CONTENT_TYPES).toEqual({
      pdf: "application/pdf",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      txt: "text/plain",
      csv: "text/csv",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif",
      svg: "image/svg+xml",
      mp4: "video/mp4",
      mov: "video/quicktime",
      webm: "video/webm",
      otf: "font/otf",
      ttf: "font/ttf",
      woff2: "font/woff2",
    });
    expect(UPLOAD_LIMIT_BY_KIND).toEqual({
      document: {
        pdf: 100e6,
        pptx: 100e6,
        docx: 50e6,
        xlsx: 50e6,
        txt: 10e6,
        csv: 10e6,
      },
      image: {
        png: 40e6,
        jpg: 40e6,
        jpeg: 40e6,
        webp: 40e6,
        heic: 40e6,
        heif: 40e6,
        svg: 5e6,
      },
      video: { mp4: 200e6, mov: 200e6, webm: 200e6 },
      font: { otf: 10e6, ttf: 10e6, woff2: 10e6 },
    });
    expect([
      MAX_UPLOAD_FILES,
      MAX_UPLOAD_BATCH_BYTES,
      MAX_TEXT_PREVIEW_BYTES,
      UPLOAD_URL_TTL_MS,
      DOWNLOAD_URL_TTL_MS,
    ]).toEqual([20, 1e9, 1e6, 600000, 300000]);
    expect(FILE_INSPECTION_STATUS_VALUES).toEqual(["unscanned"]);
    expect(StorageProvider).toEqual({ VercelBlob: "vercel-blob" });
    expect(StorageDisposition).toEqual({
      Inline: "inline",
      Attachment: "attachment",
    });
    expect(Object.values(FileErrorCode)).toEqual([
      "UNSUPPORTED_EXTENSION",
      "INVALID_SIZE",
      "FILE_TOO_LARGE",
      "TOO_MANY_FILES",
      "BATCH_TOO_LARGE",
      "MISSING_OBJECT",
      "SIZE_MISMATCH",
      "CONTENT_TYPE_MISMATCH",
      "INVALID_SIGNATURE",
      "UNSAFE_SVG",
      "INVALID_OFFICE",
      "INVALID_LINK",
    ]);
    expect(Object.values(StorageErrorCode)).toEqual([
      "STORAGE_CONFIGURATION",
      "STORAGE_INVALID_INPUT",
      "STORAGE_NOT_FOUND",
      "STORAGE_UNAVAILABLE",
      "STORAGE_INVALID_RANGE",
      "STORAGE_PROXY_REQUIRED",
    ]);
    for (const group of [
      AssetKind,
      UploadExtension,
      FileErrorCode,
      StorageErrorCode,
      StorageDisposition,
      StorageProvider,
    ])
      expect(new Set(Object.values(group)).size).toBe(
        Object.keys(group).length,
      );
  });
});
