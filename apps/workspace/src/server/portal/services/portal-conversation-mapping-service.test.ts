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
  it("adds the write and attachment capabilities to the shared view", () => {
    const attachmentAccess = { pick: true, upload: false };
    expect(
      portalConversationMappingService.toPortalDto(
        conversation,
        true,
        attachmentAccess,
      ),
    ).toEqual({ ...conversation, canWrite: true, attachmentAccess });
    expect(
      portalConversationMappingService.toPortalDto(conversation, false, {
        pick: false,
        upload: false,
      }).canWrite,
    ).toBe(false);
  });
});
