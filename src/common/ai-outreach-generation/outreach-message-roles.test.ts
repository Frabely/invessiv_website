import { describe, expect, it } from "vitest";
import { OutreachChatRole } from "./outreach-message-roles";

describe("OutreachChatRole", () => {
  it("keeps the OpenAI chat roles stable", () => {
    expect(OutreachChatRole).toEqual({
      System: "system",
      User: "user",
      Assistant: "assistant",
    });
  });
});
