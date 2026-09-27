import { describe, expect, it } from "vitest";

import { ConversationApiPath } from "./conversation-api-paths";

describe("ConversationApiPath", () => {
  it("contains the exact path segments without duplicates", () => {
    expect(ConversationApiPath).toEqual({
      Conversation: "conversation",
      Messages: "messages",
      Read: "read",
      Owner: "owner",
    });
    const values = Object.values(ConversationApiPath);
    expect(new Set(values).size).toBe(values.length);
  });
});
