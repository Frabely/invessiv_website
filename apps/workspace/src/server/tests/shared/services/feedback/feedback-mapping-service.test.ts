import { describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { feedbackMappingService } from "@/server/shared/services/feedback/feedback-mapping-service";
import type { FileRow } from "@/server/shared/files/file-object-service-types";

vi.mock("server-only", () => ({}));

const CREATED = new Date("2026-09-02T08:00:00.000Z");

function fileRow(overrides: Partial<FileRow>): FileRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    display_name: "screenshot.png",
    asset_kind: AssetKind.Image,
    source: FileSource.Upload,
    extension: "png",
    size_bytes: 2048,
    url: null,
    note: null,
    created_at: CREATED,
    ...overrides,
  } as FileRow;
}

describe("feedbackMappingService.toAttachmentDto", () => {
  it("maps an upload with every column the shared file row needs", () => {
    expect(
      feedbackMappingService.toAttachmentDto(fileRow({ note: "Startseite" })),
    ).toEqual({
      id: "11111111-1111-4111-8111-111111111111",
      displayName: "screenshot.png",
      assetKind: AssetKind.Image,
      source: FileSource.Upload,
      extension: "png",
      sizeBytes: 2048,
      url: null,
      note: "Startseite",
      createdAt: "2026-09-02T08:00:00.000Z",
    });
  });

  it("keeps a link without extension and size", () => {
    expect(
      feedbackMappingService.toAttachmentDto(
        fileRow({
          display_name: "Vorschau",
          asset_kind: AssetKind.Link,
          source: FileSource.Link,
          extension: null,
          size_bytes: null,
          url: "https://example.com",
        }),
      ),
    ).toMatchObject({
      source: FileSource.Link,
      extension: null,
      sizeBytes: null,
      url: "https://example.com",
    });
  });
});
