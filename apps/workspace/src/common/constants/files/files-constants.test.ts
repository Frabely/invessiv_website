import { describe, expect, it } from "vitest";
import {
  ARCHIVE_TIME_BUDGET_MS,
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_FILES,
} from "./file-archive-limits";
import { FileListLoadStatus } from "./file-list-load-status";
import { FileSelectionEvent } from "./file-selection-events";
import { FILES_PAGE_SIZE } from "./files-page-size";
import { FileApiPath } from "./file-api-paths";
import { FILE_ACTIVITY_ENTITY } from "./file-activity-metadata";

describe("shared files constants", () => {
  it("keeps the activity entity stable for existing timeline entries", () => {
    expect(FILE_ACTIVITY_ENTITY).toBe("file");
  });

  it("keeps the file route segments stable and unique", () => {
    expect(FileApiPath).toEqual({
      Files: "files",
      Uploads: "uploads",
      Links: "links",
      Archive: "archive",
      Complete: "complete",
      Cancel: "cancel",
      DownloadUrl: "download-url",
      Download: "download",
    });
    expect(new Set(Object.values(FileApiPath)).size).toBe(8);
  });

  it("defines unique load states and list limits", () => {
    expect(FileListLoadStatus).toEqual({
      Loading: "loading",
      LoadingMore: "loading_more",
      Ready: "ready",
      Error: "error",
    });
    expect(new Set(Object.values(FileListLoadStatus)).size).toBe(4);
    expect(FILES_PAGE_SIZE).toBe(25);
    expect(MAX_ARCHIVE_FILES).toBe(100);
    expect(MAX_ARCHIVE_BYTES).toBe(300 * 1024 * 1024);
    expect(ARCHIVE_TIME_BUDGET_MS).toBe(96_000);
    expect(FileSelectionEvent).toEqual({
      Changed: "workspace:files-selection-changed",
    });
  });
});
