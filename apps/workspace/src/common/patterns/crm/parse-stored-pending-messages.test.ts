import { describe, expect, it } from "vitest";
import { MESSAGE_BODY_MAX_LENGTH } from "@invessiv/common/constants/crm/message-limits";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { PendingMessageStatus } from "@invessiv/common/constants/ui/pending-message-statuses";
import { parseStoredPendingMessages } from "./parse-stored-pending-messages";

const valid = {
  clientId: "client-1",
  body: "Hallo",
  attachments: [],
  createdAt: "2026-09-27T08:30:00.000Z",
};

const attachment = {
  fileId: "11111111-1111-4111-8111-111111111111",
  displayName: "offer.pdf",
  assetKind: AssetKind.Document,
  releasesOnSend: true,
};

describe("parseStoredPendingMessages", () => {
  it("restores a stored send as failed so it is only retried on purpose", () => {
    expect(parseStoredPendingMessages([valid])).toEqual([
      { ...valid, status: PendingMessageStatus.Failed },
    ]);
  });

  it("restores entries stored before attachments existed without any", () => {
    const legacy = {
      clientId: valid.clientId,
      body: valid.body,
      createdAt: valid.createdAt,
    };
    expect(parseStoredPendingMessages([legacy])).toEqual([
      { ...valid, status: PendingMessageStatus.Failed },
    ]);
  });

  it("restores a send with attachments only", () => {
    const withFile = { ...valid, body: "", attachments: [attachment] };
    expect(parseStoredPendingMessages([withFile])).toEqual([
      { ...withFile, status: PendingMessageStatus.Failed },
    ]);
  });

  it("drops malformed entries one by one and keeps the valid ones", () => {
    expect(
      parseStoredPendingMessages([
        valid,
        { ...valid, body: "   " },
        { ...valid, body: "x".repeat(MESSAGE_BODY_MAX_LENGTH + 1) },
        { ...valid, createdAt: "yesterday" },
        { ...valid, clientId: "" },
        { ...valid, attachments: [{ ...attachment, fileId: "x" }] },
        null,
        "text",
      ]),
    ).toEqual([{ ...valid, status: PendingMessageStatus.Failed }]);
  });

  it("returns nothing for anything but a list", () => {
    expect(parseStoredPendingMessages({ entries: [valid] })).toEqual([]);
    expect(parseStoredPendingMessages(null)).toEqual([]);
  });
});
