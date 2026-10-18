import { describe, expect, it } from "vitest";
import { FilePreviewStageVariant } from "./file-preview-stage-variants";

describe("FilePreviewStageVariant", () => {
  it("contains the two unique layout variants", () => {
    expect(FilePreviewStageVariant).toEqual({
      Dialog: "dialog",
      Panel: "panel",
    });
  });
});
