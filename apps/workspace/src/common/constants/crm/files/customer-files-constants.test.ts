import { describe, expect, it } from "vitest";
import { CUSTOMER_FILES_PAGE_SIZE } from "./customer-files-list-limits";
import {
  CUSTOMER_WIDE_FILES_FILTER,
  CustomerFilesQueryParam,
} from "./customer-files-query-params";
import { FileListLoadStatus } from "./file-list-load-status";

describe("customer files constants", () => {
  it("keeps URL parameters prefixed and unique", () => {
    expect(CustomerFilesQueryParam).toEqual({
      Project: "filesProject",
      Kind: "filesKind",
      Origin: "filesOrigin",
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
  });
});
