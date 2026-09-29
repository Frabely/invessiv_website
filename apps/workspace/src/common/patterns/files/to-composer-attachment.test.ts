import { describe, expect, it } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { toComposerAttachment } from "./to-composer-attachment";

describe("toComposerAttachment", () => {
  it("keeps only what the composer shows and sends", () => {
    expect(
      toComposerAttachment(
        {
          id: "file-1",
          displayName: "offer.pdf",
          assetKind: AssetKind.Document,
        },
        true,
      ),
    ).toEqual({
      fileId: "file-1",
      displayName: "offer.pdf",
      assetKind: AssetKind.Document,
      releasesOnSend: true,
    });
  });
});
