"use client";

import { useMemo } from "react";
import type { PortalConversationDto } from "@invessiv/common/contracts/portal/portal-conversation.dto";
import { portalMessagesApiService } from "@/client/portal/portal-messages-api-service";
import type { ConversationThreadApi } from "@/common/contracts/crm/conversation-thread-api";
import { useConversationThread } from "@/hooks/shared/use-conversation-thread";

/** The portal side of the customer conversation; same thread behaviour as in the CRM. */
export function usePortalConversation(
  customerId: string,
  initialConversation: PortalConversationDto | null,
  active: boolean,
  storageScopeId: string,
) {
  const api = useMemo<ConversationThreadApi<PortalConversationDto>>(
    () => ({
      getConversation: (cursor) =>
        portalMessagesApiService.getConversation(customerId, cursor),
      sendMessage: (input) =>
        portalMessagesApiService.sendMessage(customerId, input),
      markRead: () => portalMessagesApiService.markRead(customerId),
    }),
    [customerId],
  );
  return useConversationThread(
    api,
    initialConversation,
    active,
    storageScopeId,
  );
}
