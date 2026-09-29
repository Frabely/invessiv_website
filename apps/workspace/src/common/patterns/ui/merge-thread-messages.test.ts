import { describe, expect, it } from "vitest";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { mergeThreadMessages } from "./merge-thread-messages";

function message(id: string, createdAt: string, body = id): MessageDto {
  return {
    id,
    conversationId: "c",
    type: MessageType.Text,
    body,
    attachments: [],
    metadata: null,
    senderSide: MessageSenderSide.Customer,
    senderDisplayName: "Anna",
    isOwn: false,
    createdAt,
    redactedAt: null,
  };
}

describe("mergeThreadMessages", () => {
  it("sorts older and newer pages and prefers the incoming version", () => {
    const merged = mergeThreadMessages(
      [
        message("b", "2026-09-20T10:00:00.000Z"),
        message("c", "2026-09-20T11:00:00.000Z"),
      ],
      [
        message("a", "2026-09-20T09:00:00.000Z"),
        message("c", "2026-09-20T11:00:00.000Z", "updated"),
      ],
    );

    expect(merged.map((entry) => entry.id)).toEqual(["a", "b", "c"]);
    expect(merged[2].body).toBe("updated");
  });

  it("orders equal timestamps by id like the server cursor", () => {
    const at = "2026-09-20T10:00:00.000Z";
    expect(
      mergeThreadMessages([message("y", at)], [message("x", at)]).map(
        (entry) => entry.id,
      ),
    ).toEqual(["x", "y"]);
  });
});
