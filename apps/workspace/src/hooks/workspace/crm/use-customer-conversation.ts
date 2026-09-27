"use client";

import { useCallback, useMemo } from "react";
import type { InternalConversationDto } from "@invessiv/common/contracts/crm/internal-conversation.dto";
import { messagesApiService } from "@/client/crm/messages-api-service";
import type { ConversationThreadApi } from "@/common/contracts/crm/conversation-thread-api";
import { useConversationThread } from "@/hooks/shared/use-conversation-thread";

/** The CRM side of a customer conversation; adds the owner's redaction to the shared thread. */
export function useCustomerConversation(
  customerId: string,
  initialConversation: InternalConversationDto | null,
  active: boolean,
  storageScopeId: string,
) {
  const api = useMemo<ConversationThreadApi<InternalConversationDto>>(
    () => ({
      getConversation: (cursor) =>
        messagesApiService.getConversation(customerId, cursor),
      sendMessage: (input) => messagesApiService.sendMessage(customerId, input),
      markRead: (lastSeenMessageId) =>
        messagesApiService.markRead(customerId, lastSeenMessageId),
    }),
    [customerId],
  );
  const thread = useConversationThread(
    api,
    initialConversation,
    active,
    storageScopeId,
  );
  const { reload, replaceMessage } = thread;

  const redact = useCallback(
    async (messageId: string) => {
      const result = await messagesApiService.redactMessage(messageId);
      if (result.ok) {
        replaceMessage(result.value);
        await reload();
      }
      return result.ok;
    },
    [reload, replaceMessage],
  );

  return { ...thread, redact } as const;
}
