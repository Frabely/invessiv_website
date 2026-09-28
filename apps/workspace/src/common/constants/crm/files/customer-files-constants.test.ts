import { describe, expect, it } from "vitest";
import { CUSTOMER_FILES_PAGE_SIZE } from "./customer-files-list-limits";
import {
  ARCHIVE_TIME_BUDGET_MS,
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_FILES,
} from "./file-archive-limits";
import {
  CUSTOMER_WIDE_FILES_FILTER,
  CustomerFilesQueryParam,
} from "./customer-files-query-params";
import { FileListLoadStatus } from "./file-list-load-status";
import { FileSelectionEvent } from "./file-selection-events";

describe("customer files constants", () => {
  it("keeps URL parameters prefixed and unique", () => {
    expect(CustomerFilesQueryParam).toEqual({
      Project: "filesProject",
      Kind: "filesKind",
      Origin: "filesOrigin",
      Selected: "filesSelected",
    });
    expect(CUSTOMER_WIDE_FILES_FILTER).toBe("customer");
  });

  it("defines unique load states and list limits", () => {
    expect(FileListLoadStatus).toEqual({
      Loading: "loading",
      LoadingMore: "loading_more",
      Ready: "ready",
      Error: "error",
    });
    expect(new Set(Object.values(FileListLoadStatus)).size).toBe(4);
    expect(CUSTOMER_FILES_PAGE_SIZE).toBe(25);
    expect(MAX_ARCHIVE_FILES).toBe(100);
    expect(MAX_ARCHIVE_BYTES).toBe(300 * 1024 * 1024);
    expect(ARCHIVE_TIME_BUDGET_MS).toBe(96_000);
    expect(FileSelectionEvent).toEqual({
      Changed: "workspace:files-selection-changed",
    });
  });
});
