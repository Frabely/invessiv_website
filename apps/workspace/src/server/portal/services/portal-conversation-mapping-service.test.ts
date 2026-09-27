import { describe, expect, it, vi } from "vitest";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import { portalConversationMappingService } from "./portal-conversation-mapping-service";

vi.mock("server-only", () => ({}));

const conversation: ConversationDto = {
  id: null,
  customerId: "22222222-2222-4222-8222-222222222222",
  unreadCount: 0,
  lastMessageAt: null,
  messages: [],
  nextCursor: null,
};

describe("portalConversationMappingService.toPortalDto", () => {
  it("adds only the write capability to the shared view", () => {
    expect(
      portalConversationMappingService.toPortalDto(conversation, true),
    ).toEqual({ ...conversation, canWrite: true });
    expect(
      portalConversationMappingService.toPortalDto(conversation, false)
        .canWrite,
    ).toBe(false);
  });
});
