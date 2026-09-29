import { expect, it } from "vitest";
import { FileQueryParam } from "./file-query-params";

it("keeps file query names stable and unique", () => {
  expect(FileQueryParam).toEqual({
    Page: "page",
    PageSize: "pageSize",
    ProjectId: "projectId",
    AssetKind: "assetKind",
    Origin: "origin",
    Search: "search",
    Shareable: "shareable",
    Disposition: "disposition",
    ArchiveFileId: "fileId",
    ArchivePreflight: "preflight",
    ArchiveFilename: "filename",
  });
  expect(new Set(Object.values(FileQueryParam)).size).toBe(
    Object.keys(FileQueryParam).length,
  );
});
