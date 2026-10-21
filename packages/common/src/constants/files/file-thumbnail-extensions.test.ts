import { expect, it } from "vitest";
import { FILE_THUMBNAIL_EXTENSIONS } from "./file-thumbnail-extensions";
import { UploadExtension } from "./upload-extension";

it("limits thumbnails to the supported unique raster extensions", () => {
  expect(FILE_THUMBNAIL_EXTENSIONS).toEqual([
    UploadExtension.Png,
    UploadExtension.Jpg,
    UploadExtension.Jpeg,
    UploadExtension.Webp,
  ]);
  expect(new Set(FILE_THUMBNAIL_EXTENSIONS).size).toBe(
    FILE_THUMBNAIL_EXTENSIONS.length,
  );
});
