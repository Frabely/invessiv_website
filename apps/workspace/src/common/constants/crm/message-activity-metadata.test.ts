import { describe, expect, it } from "vitest";
import {
  CONVERSATION_ACTIVITY_ENTITY,
  MESSAGE_ACTIVITY_ENTITY,
  MessageActivityChange,
} from "@/common/constants/crm/message-activity-metadata";

describe("message activity metadata", () => {
  it("names the entities and changes exactly", () => {
    expect(MESSAGE_ACTIVITY_ENTITY).toBe("message");
    expect(CONVERSATION_ACTIVITY_ENTITY).toBe("conversation");
    expect(MessageActivityChange).toEqual({ Redacted: "redacted" });
  });
});
