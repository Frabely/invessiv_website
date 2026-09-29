import { describe, expect, it, vi } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { feedbackMappingService } from "@/server/shared/services/feedback/feedback-mapping-service";

vi.mock("server-only", () => ({}));

describe("feedbackMappingService.toAttachmentDto", () => {
  it("maps every file column", () => {
    expect(
      feedbackMappingService.toAttachmentDto({
        fileId: "11111111-1111-4111-8111-111111111111",
        displayName: "screenshot.png",
        assetKind: AssetKind.Image,
        sizeBytes: 2048,
      }),
    ).toEqual({
      fileId: "11111111-1111-4111-8111-111111111111",
      displayName: "screenshot.png",
      assetKind: AssetKind.Image,
      sizeBytes: 2048,
    });
  });

  it("shows a missing size as 0 bytes", () => {
    expect(
      feedbackMappingService.toAttachmentDto({
        fileId: "11111111-1111-4111-8111-111111111111",
        displayName: "notes.pdf",
        assetKind: AssetKind.Document,
        sizeBytes: null,
      }).sizeBytes,
    ).toBe(0);
  });
});

describe("feedbackMappingService.fileToAttachmentDto", () => {
  it("maps a file row and shows a link without size as 0 bytes", () => {
    const row = {
      id: "22222222-2222-4222-8222-222222222222",
      display_name: "Vorschau",
      asset_kind: AssetKind.Link,
      size_bytes: null,
    } as Parameters<typeof feedbackMappingService.fileToAttachmentDto>[0];
    expect(feedbackMappingService.fileToAttachmentDto(row)).toEqual({
      fileId: "22222222-2222-4222-8222-222222222222",
      displayName: "Vorschau",
      assetKind: AssetKind.Link,
      sizeBytes: 0,
    });
  });
});
