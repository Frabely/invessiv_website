import { describe, expect, it } from "vitest";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { filePreviewSelection } from "./file-preview-selection";

describe("filePreviewSelection", () => {
  it("keeps previewable uploads and resolves the current id", () => {
    const files = [
      {
        id: "image",
        source: FileSource.Upload,
        extension: "png",
        sizeBytes: 12,
      },
      { id: "link", source: FileSource.Link, extension: null, sizeBytes: null },
    ] as const;
    const previewable = filePreviewSelection.list(files);
    expect(previewable.map((file) => file.id)).toEqual(["image"]);
    expect(filePreviewSelection.indexOf(previewable, "image")).toBe(0);
    expect(filePreviewSelection.indexOf(previewable, "link")).toBe(-1);
  });
});
