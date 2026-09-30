import { describe, expect, it } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import type { FileRow } from "@/server/shared/files/file-object-service-types";
import { filePresentationMappingService } from "@/server/shared/files/file-presentation-mapping-service";

describe("filePresentationMappingService", () => {
  it("maps only presentation fields and preserves nullable link metadata", () => {
    const row = {
      id: "file-1",
      display_name: "Screenshot",
      asset_kind: AssetKind.Image,
      source: FileSource.Upload,
      extension: UploadExtension.Png,
      size_bytes: 123,
      url: null,
      note: null,
      created_at: new Date("2026-09-28T10:00:00Z"),
      storage_key: "never-expose",
    } as FileRow;

    expect(filePresentationMappingService.toFields(row)).toEqual({
      id: "file-1",
      displayName: "Screenshot",
      assetKind: AssetKind.Image,
      source: FileSource.Upload,
      extension: UploadExtension.Png,
      sizeBytes: 123,
      url: null,
      note: null,
      createdAt: "2026-09-28T10:00:00.000Z",
    });
  });
});
