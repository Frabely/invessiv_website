import { describe, expect, it } from "vitest";
import {
  classifyUploadCandidate,
  validateUploadBatch,
} from "./classify-upload-candidate";
import { createFileStorageKey, sanitizeFilename } from "./safe-filename";
import { validateFileLink } from "./validate-file-link";
import { FileErrorCode } from "../../constants/files/file-error-code";
import { UPLOAD_LIMIT_BY_KIND } from "../../constants/files/upload-limits";

describe("upload policy", () => {
  it("enforces every extension boundary and ignores browser MIME types", () => {
    for (const [assetKind, limits] of Object.entries(UPLOAD_LIMIT_BY_KIND)) {
      for (const [extension, size] of Object.entries(limits)) {
        expect(
          classifyUploadCandidate({
            name: "file." + extension.toUpperCase(),
            size,
          }),
        ).toMatchObject({ ok: true, assetKind, extension, maxBytes: size });
        expect(
          classifyUploadCandidate({
            name: "file." + extension,
            size: size + 1,
          }),
        ).toEqual({ ok: false, code: FileErrorCode.TooLarge });
      }
    }
  });
  it.each([
    "docm",
    "xlsm",
    "pptm",
    "html",
    "zip",
    "gif",
    "avif",
    "exe",
    "doc",
    "mp3",
    "rtf",
  ])("rejects %s", (extension) => {
    expect(
      classifyUploadCandidate({ name: "file." + extension, size: 10 }).ok,
    ).toBe(false);
  });
  it.each([0, -1, NaN, Infinity, 0.5])("rejects invalid size %s", (size) => {
    expect(classifyUploadCandidate({ name: "file.pdf", size })).toEqual({
      ok: false,
      code: FileErrorCode.InvalidSize,
    });
  });
  it("allows twenty large photos and enforces both batch ceilings", () => {
    expect(
      validateUploadBatch(
        Array.from({ length: 20 }, () => ({ name: "a.png", size: 40e6 })),
      ),
    ).toBeNull();
    expect(
      validateUploadBatch(
        Array.from({ length: 21 }, () => ({ name: "a.png", size: 1 })),
      ),
    ).toBe(FileErrorCode.TooManyFiles);
    expect(
      validateUploadBatch(
        Array.from({ length: 6 }, () => ({ name: "a.mp4", size: 200e6 })),
      ),
    ).toBe(FileErrorCode.BatchTooLarge);
  });
  it("sanitizes traversal, controls, Unicode and long filenames", () => {
    expect(sanitizeFilename("???.png")).toBe("file.png");
    expect(sanitizeFilename("..png")).toBe("file.png");
    expect(
      classifyUploadCandidate({ name: "folder.ext/png", size: 1 }).ok,
    ).toBe(false);
    expect(sanitizeFilename("../..\\Grüße\r\n.PDF")).toBe("Grüße.pdf");
    expect(sanitizeFilename("a..b.png")).toBe("a.b.png");
    expect(sanitizeFilename("Mu\u0308nchen.png")).toBe("München.png");
    expect(sanitizeFilename("CON.txt")).toBe("_CON.txt");
    const long = sanitizeFilename("😀".repeat(200) + ".png");
    expect(new TextEncoder().encode(long).length).toBeLessThanOrEqual(180);
    expect(long.endsWith(".png")).toBe(true);
    expect(sanitizeFilename("...")).toBe("file");
    // An implausibly long "extension" degrades like every other malformed
    // case instead of throwing — the whole cleaned name becomes the stem.
    const noRealExtension = sanitizeFilename("file." + "x".repeat(30));
    expect(noRealExtension).toBe("file." + "x".repeat(30));
    expect(() => sanitizeFilename("file." + "x".repeat(30))).not.toThrow();
    const id = "00000000-0000-0000-0000-000000000001";
    expect(createFileStorageKey(id, id, "../a.png")).toBe(
      `customers/${id}/${id}/a.png`,
    );
    expect(() => createFileStorageKey("../bad", id, "a.png")).toThrow();
  });
  it.each([
    "http://example.com",
    "javascript:alert(1)",
    "https://user:pass@example.com",
    "https://example.com/a b",
    "https://example.com/" + "a".repeat(2048),
  ])("rejects unsafe links", (value) => {
    expect(validateFileLink(value)).toBe(false);
  });
  it("allows HTTPS without requesting it", () => {
    expect(validateFileLink("https://example.com/file?q=1#part")).toBe(true);
  });
});
