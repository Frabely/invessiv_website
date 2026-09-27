"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MessageErrorCode } from "@invessiv/common/constants/crm/message-error-codes";
import { MESSAGE_BODY_MAX_LENGTH } from "@invessiv/common/constants/crm/message-limits";
import { PendingMessageStatus } from "@invessiv/common/constants/ui/pending-message-statuses";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import type { PendingThreadMessage } from "@invessiv/common/contracts/ui/pending-thread-message";
import {
  MESSAGE_DRAFT_STORAGE_KEY_PREFIX,
  MESSAGE_PENDING_STORAGE_KEY_PREFIX,
} from "@/common/constants/crm/message-draft-storage";
import type { ConversationThreadApi } from "@/common/contracts/crm/conversation-thread-api";
import { mergeThreadMessages } from "@/common/patterns/ui/merge-thread-messages";

type ThreadState<TConversation extends ConversationDto> = {
  conversation: TConversation | null;
  messages: MessageDto[];
  nextCursor: string | null;
  /** True once an older page was added; a reload then keeps the older cursor. */
  extendedBack: boolean;
};

function stateFrom<TConversation extends ConversationDto>(
  conversation: TConversation | null,
): ThreadState<TConversation> {
  return {
    conversation,
    messages: conversation?.messages ?? [],
    nextCursor: conversation?.nextCursor ?? null,
    extendedBack: false,
  };
}

function readPending(storageKey: string): PendingThreadMessage[] {
  try {
    const stored: unknown = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "[]",
    );
    if (!Array.isArray(stored)) return [];
    return stored.flatMap((entry: unknown) => {
      if (
        typeof entry !== "object" ||
        entry === null ||
        !("clientId" in entry) ||
        typeof entry.clientId !== "string" ||
        !("body" in entry) ||
        typeof entry.body !== "string" ||
        entry.body.length === 0 ||
        entry.body.length > MESSAGE_BODY_MAX_LENGTH ||
        !("createdAt" in entry) ||
        typeof entry.createdAt !== "string" ||
        !Number.isFinite(Date.parse(entry.createdAt))
      )
        return [];
      return [
        {
          clientId: entry.clientId,
          body: entry.body,
          createdAt: entry.createdAt,
          status: PendingMessageStatus.Failed,
        },
      ];
    });
  } catch {
    return [];
  }
}

function writePending(
  storageKey: string,
  pending: readonly PendingThreadMessage[],
) {
  try {
    if (pending.length > 0)
      window.localStorage.setItem(storageKey, JSON.stringify(pending));
    else window.localStorage.removeItem(storageKey);
  } catch {
    // A storage failure leaves the current in-memory retry state intact.
  }
}

/**
 * Loads, sends and marks one conversation as read, for the CRM and the portal alike. There is no
 * live connection: the thread reloads when it opens, after sending and whenever the tab becomes
 * visible again. `api` must be stable across renders. `storageScopeId` binds drafts and failed
 * sends to one viewer and conversation.
 */
export function useConversationThread<TConversation extends ConversationDto>(
  api: ConversationThreadApi<TConversation>,
  initialConversation: TConversation | null,
  active: boolean,
  storageScopeId: string,
) {
  const router = useRouter();
  const [state, setState] = useState(() => stateFrom(initialConversation));
  const [pending, setPending] = useState<PendingThreadMessage[]>([]);
  const [hydratedPendingKey, setHydratedPendingKey] = useState<string | null>(
    null,
  );
  const pendingStorageKey = `${MESSAGE_PENDING_STORAGE_KEY_PREFIX}${storageScopeId}`;
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderFailed, setOlderFailed] = useState(false);
  const [sendError, setSendError] = useState<MessageErrorCode | null>(null);
  const markingRead = useRef(false);

  useEffect(() => {
    setPending(readPending(pendingStorageKey));
    setHydratedPendingKey(pendingStorageKey);
  }, [pendingStorageKey]);

  useEffect(() => {
    if (hydratedPendingKey === pendingStorageKey)
      writePending(pendingStorageKey, pending);
  }, [hydratedPendingKey, pending, pendingStorageKey]);

  const reload = useCallback(
    () =>
      api.getConversation(null).then((result) => {
        setLoadFailed(!result.ok);
        if (!result.ok) return;
        setState((current) => ({
          conversation: result.value,
          messages: mergeThreadMessages(
            current.messages,
            result.value.messages,
          ),
          nextCursor: current.extendedBack
            ? current.nextCursor
            : result.value.nextCursor,
          extendedBack: current.extendedBack,
        }));
      }),
    [api],
  );

  const loadOlder = useCallback(async () => {
    if (!state.nextCursor) return;
    setLoadingOlder(true);
    const result = await api.getConversation(state.nextCursor);
    setLoadingOlder(false);
    setOlderFailed(!result.ok);
    if (!result.ok) return;
    setState((current) => ({
      ...current,
      messages: mergeThreadMessages(current.messages, result.value.messages),
      nextCursor: result.value.nextCursor,
      extendedBack: true,
    }));
  }, [api, state.nextCursor]);

  // Only a visible thread counts as read; counters and badges come from the server render.
  const unreadCount = state.conversation?.unreadCount ?? 0;
  useEffect(() => {
    if (!active || unreadCount === 0 || markingRead.current) return;
    markingRead.current = true;
    void api.markRead().then((result) => {
      markingRead.current = false;
      if (!result.ok) return;
      setState((current) =>
        current.conversation
          ? {
              ...current,
              conversation: { ...current.conversation, unreadCount: 0 },
            }
          : current,
      );
      router.refresh();
    });
  }, [active, api, router, unreadCount]);

  useEffect(() => {
    if (!active) return;
    // Opening always shows the current state, even when the server prop is older.
    void reload();

    function handleVisibility() {
      if (document.visibilityState === "visible") void reload();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [active, reload]);

  const deliver = useCallback(
    async (entry: PendingThreadMessage) => {
      const result = await api.sendMessage({ body: entry.body });
      if (!result.ok) {
        setSendError(result.code);
        setPending((current) =>
          current.map((item) =>
            item.clientId === entry.clientId
              ? { ...item, status: PendingMessageStatus.Failed }
              : item,
          ),
        );
        return;
      }
      setSendError(null);
      setPending((current) =>
        current.filter((item) => item.clientId !== entry.clientId),
      );
      setState((current) => ({
        ...current,
        messages: mergeThreadMessages(current.messages, [result.value]),
      }));
      void reload();
    },
    [api, reload],
  );

  const send = useCallback(
    (body: string) => {
      const entry: PendingThreadMessage = {
        clientId: crypto.randomUUID(),
        body,
        createdAt: new Date().toISOString(),
        status: PendingMessageStatus.Sending,
      };
      setPending((current) => [...current, entry]);
      void deliver(entry);
    },
    [deliver],
  );

  const retry = useCallback(
    (clientId: string) => {
      const entry = pending.find((item) => item.clientId === clientId);
      if (!entry) return;
      const again = { ...entry, status: PendingMessageStatus.Sending };
      setPending((current) =>
        current.map((item) => (item.clientId === clientId ? again : item)),
      );
      void deliver(again);
    },
    [deliver, pending],
  );

  return {
    conversation: state.conversation,
    draftStorageKey: `${MESSAGE_DRAFT_STORAGE_KEY_PREFIX}${storageScopeId}`,
    messages: state.messages,
    hasOlder: state.nextCursor !== null,
    pending,
    loadFailed,
    loadingOlder,
    olderFailed,
    /** Code of the last failed send; cleared by the next successful one. */
    sendError,
    reload,
    loadOlder,
    send,
    retry,
  } as const;
}
