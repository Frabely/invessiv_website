import { describe, expect, it } from "vitest";
import { FILE_SOURCE_VALUES } from "./file-source";
import { FILE_STATUS_VALUES } from "./file-status";
import { UPLOAD_SIDE_VALUES } from "./upload-side";
import { FILE_ORIGIN_VALUES } from "./file-origin";
import { FileApiErrorCode } from "./file-api-error-code";

describe("file model constants", () => {
  it("defines stable values without duplicates", () => {
    expect(FILE_SOURCE_VALUES).toEqual(["upload", "link"]);
    expect(FILE_STATUS_VALUES).toEqual(["pending", "ready"]);
    expect(UPLOAD_SIDE_VALUES).toEqual(["internal", "customer"]);
    expect(FILE_ORIGIN_VALUES).toEqual(["customer", "shared", "internal"]);
    expect(Object.values(FileApiErrorCode)).toEqual([
      "FILE_NOT_FOUND",
      "FILE_VALIDATION_ERROR",
      "FILE_ARCHIVE_LIMIT",
      "FILE_ARCHIVE_VIDEO",
      "FILE_PENDING_LIMIT",
      "FILE_CUSTOMER_VISIBILITY",
      "FILE_FEEDBACK_BOUND",
      "FILE_UPLOAD_OWNER",
      "FILE_NOT_UPLOAD",
      "FILE_STORAGE_UNAVAILABLE",
      "FILE_INTERNAL",
    ]);
    for (const values of [
      FILE_SOURCE_VALUES,
      FILE_STATUS_VALUES,
      UPLOAD_SIDE_VALUES,
      FILE_ORIGIN_VALUES,
      Object.values(FileApiErrorCode),
    ])
      expect(new Set(values).size).toBe(values.length);
  });
});
