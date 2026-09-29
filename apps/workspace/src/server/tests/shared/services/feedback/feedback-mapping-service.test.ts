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
