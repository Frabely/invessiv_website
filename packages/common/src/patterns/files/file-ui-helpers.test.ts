import { describe, expect, it } from "vitest";
import { FileApiErrorCode } from "../../constants/files/file-api-error-code";
import { FileErrorCode } from "../../constants/files/file-error-code";
import { FilePreviewKind } from "../../constants/files/file-preview-kind";
import { FileSource } from "../../constants/files/file-source";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "../../constants/files/upload-accept";
import {
  MAX_PARALLEL_UPLOADS,
  MAX_TEXT_PREVIEW_BYTES,
} from "../../constants/files/upload-limits";
import { UploadQueueItemStatus } from "../../constants/files/upload-queue-item-status";
import { UploadTransferErrorCode } from "../../constants/files/upload-transfer-error-code";
import type { UploadExtension } from "../../constants/files/upload-extension";
import { filePresentation } from "./file-presentation";
import { uploadQueuePlan } from "./upload-queue-plan";

function upload(extension: UploadExtension, sizeBytes = 10) {
  return { source: FileSource.Upload, extension, sizeBytes };
}

describe("filePresentation", () => {
  it.each([
    ["png", FilePreviewKind.Image],
    ["svg", FilePreviewKind.Image],
    ["pdf", FilePreviewKind.Pdf],
    ["csv", FilePreviewKind.Text],
    ["webm", FilePreviewKind.Video],
    ["mov", null],
    ["heic", null],
    ["docx", null],
    ["woff2", null],
  ] as const)("previews %s as %s", (extension, kind) => {
    expect(filePresentation.previewKindOf(upload(extension))).toBe(kind);
  });

  it("downloads large text and never previews links", () => {
    expect(
      filePresentation.previewKindOf(upload("txt", MAX_TEXT_PREVIEW_BYTES)),
    ).toBe(FilePreviewKind.Text);
    expect(
      filePresentation.previewKindOf(upload("txt", MAX_TEXT_PREVIEW_BYTES + 1)),
    ).toBeNull();
    expect(
      filePresentation.previewKindOf({
        source: FileSource.Link,
        extension: null,
        sizeBytes: null,
      }),
    ).toBeNull();
  });

  it("formats sizes with decimal units", () => {
    expect(filePresentation.formatSize(512, "en")).toBe("512 byte");
    expect(filePresentation.formatSize(1_500, "en")).toBe("1.5 kB");
    expect(filePresentation.formatSize(40_000_000, "de")).toBe("40 MB");
    expect(filePresentation.formatSize(250_000_000, "en")).toBe("250 MB");
    expect(filePresentation.formatDate("2026-09-28T10:00:00.000Z", "en")).toBe(
      "Sep 28, 2026",
    );
  });

  it("shows the bare host of a link", () => {
    expect(
      filePresentation.linkHost("https://www.drive.google.com/file/d/1"),
    ).toBe("drive.google.com");
    expect(filePresentation.linkHost("not a url")).toBeNull();
  });
});

describe("uploadQueuePlan", () => {
  it("refuses unsupported files and files beyond the batch budget one by one", () => {
    const plan = uploadQueuePlan.planSelection(
      [
        { name: "a.exe", size: 1 },
        { name: "b.png", size: 1 },
        { name: "c.png", size: 1 },
      ],
      { count: 19, bytes: 0 },
    );
    expect(plan.map((entry) => (entry.ok ? "ok" : entry.code))).toEqual([
      FileErrorCode.UnsupportedExtension,
      "ok",
      FileErrorCode.TooManyFiles,
    ]);
    expect(
      uploadQueuePlan.planSelection([{ name: "a.mp4", size: 200_000_000 }], {
        count: 1,
        bytes: 900_000_000,
      }),
    ).toEqual([{ ok: false, code: FileErrorCode.BatchTooLarge }]);
  });

  it("narrows the count budget to a smaller limit but never widens it", () => {
    const files = [
      { name: "a.png", size: 1 },
      { name: "b.png", size: 1 },
    ];
    expect(
      uploadQueuePlan
        .planSelection(files, { count: 0, bytes: 0 }, 1)
        .map((entry) => (entry.ok ? "ok" : entry.code)),
    ).toEqual(["ok", FileErrorCode.TooManyFiles]);
    expect(
      uploadQueuePlan
        .planSelection(files, { count: 19, bytes: 0 }, 50)
        .map((entry) => (entry.ok ? "ok" : entry.code)),
    ).toEqual(["ok", FileErrorCode.TooManyFiles]);
  });

  it("retries only transient failures", () => {
    expect(uploadQueuePlan.isRetryable(UploadTransferErrorCode.Network)).toBe(
      true,
    );
    expect(
      uploadQueuePlan.isRetryable(FileApiErrorCode.StorageUnavailable),
    ).toBe(true);
    expect(uploadQueuePlan.isRetryable(FileErrorCode.InvalidSignature)).toBe(
      false,
    );
    expect(uploadQueuePlan.isRetryable(FileApiErrorCode.Validation)).toBe(
      false,
    );
  });

  it("keeps the queue constants stable", () => {
    expect(FilePreviewKind).toEqual({
      Image: "image",
      Pdf: "pdf",
      Text: "text",
      Video: "video",
    });
    expect(Object.values(UploadQueueItemStatus)).toEqual([
      "staged",
      "rejected",
      "queued",
      "uploading",
      "finalizing",
      "done",
      "failed",
      "cancelled",
    ]);
    expect(MAX_PARALLEL_UPLOADS).toBe(3);
    expect(UPLOAD_ACCEPT_ATTRIBUTE.split(",")).toContain(".woff2");
    expect(Object.values(UploadQueueItemStatus)).toHaveLength(
      new Set(Object.values(UploadQueueItemStatus)).size,
    );
    expect(Object.values(UploadTransferErrorCode)).toEqual([
      "UPLOAD_NETWORK",
      "UPLOAD_REFUSED",
    ]);
  });
});
