import { describe, expect, it } from "vitest";
import { FileDropZoneVariant } from "./file-drop-zone-variants";

describe("FileDropZoneVariant", () => {
  it("contains the two unique layout variants", () => {
    expect(FileDropZoneVariant).toEqual({
      Large: "large",
      Compact: "compact",
    });
  });
});
