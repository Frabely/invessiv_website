import { describe, expect, it } from "vitest";
import { MESSAGE_ATTACHMENTS_MAX } from "@invessiv/common/constants/crm/message-limits";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";
import { mergeComposerAttachments } from "./merge-composer-attachments";

function attachment(fileId: string): ComposerAttachment {
  return {
    fileId,
    displayName: `${fileId}.pdf`,
    assetKind: AssetKind.Document,
    releasesOnSend: false,
  };
}

describe("mergeComposerAttachments", () => {
  it("appends new entries in picking order and skips duplicates", () => {
    expect(
      mergeComposerAttachments(
        [attachment("a")],
        [attachment("b"), attachment("a"), attachment("c")],
      ).map((entry) => entry.fileId),
    ).toEqual(["a", "b", "c"]);
  });

  it("stops at the per-message limit", () => {
    const many = Array.from({ length: MESSAGE_ATTACHMENTS_MAX + 3 }, (_, i) =>
      attachment(String(i)),
    );
    expect(mergeComposerAttachments([], many)).toHaveLength(
      MESSAGE_ATTACHMENTS_MAX,
    );
  });
});
