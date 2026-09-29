import { describe, expect, it } from "vitest";
import { AttachmentChipKind } from "./attachment-chip-kinds";

describe("AttachmentChipKind", () => {
  it("defines distinct chip kinds", () => {
    expect(AttachmentChipKind).toEqual({
      Static: "static",
      Removable: "removable",
      Download: "download",
      Link: "link",
    });
    expect(new Set(Object.values(AttachmentChipKind)).size).toBe(
      Object.values(AttachmentChipKind).length,
    );
  });
});
