import { describe, expect, it } from "vitest";
import { MESSAGE_BODY_MAX_LENGTH } from "@invessiv/common/constants/crm/message-limits";
import { PendingMessageStatus } from "@invessiv/common/constants/ui/pending-message-statuses";
import { parseStoredPendingMessages } from "./parse-stored-pending-messages";

const valid = {
  clientId: "client-1",
  body: "Hallo",
  createdAt: "2026-09-27T08:30:00.000Z",
};

describe("parseStoredPendingMessages", () => {
  it("restores a stored send as failed so it is only retried on purpose", () => {
    expect(parseStoredPendingMessages([valid])).toEqual([
      { ...valid, status: PendingMessageStatus.Failed },
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
