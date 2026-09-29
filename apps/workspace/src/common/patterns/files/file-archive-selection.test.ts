import { describe, expect, it } from "vitest";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";
import { fileArchiveSelection } from "./file-archive-selection";

describe("fileArchiveSelection", () => {
  it("excludes videos and keeps an already selected file selectable at the limit", () => {
    const document = { id: "document", assetKind: AssetKind.Document };
    const video = { id: "video", assetKind: AssetKind.Video };
    const selected = [
      document.id,
      ...Array.from(
        { length: MAX_ARCHIVE_FILES - 1 },
        (_, index) => `other-${index}`,
      ),
    ];

    expect(fileArchiveSelection.shownIds([document, video])).toEqual([
      "document",
    ]);
    expect(fileArchiveSelection.canSelect(document, selected)).toBe(true);
    expect(
      fileArchiveSelection.canSelect(
        { id: "new", assetKind: AssetKind.Document },
        selected,
      ),
    ).toBe(false);
    expect(fileArchiveSelection.canSelect(video, [])).toBe(false);
  });
});
