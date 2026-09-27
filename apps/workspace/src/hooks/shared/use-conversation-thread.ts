import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { MessageThreadProps } from "@invessiv/ui";
import type { MessageErrorCode } from "@invessiv/common/constants/crm/errors/message-error-codes";
import { PendingMessageStatus } from "@invessiv/common/constants/ui/pending-message-statuses";
import { MessageType } from "@invessiv/common/constants/crm/message-types";
import type { ConversationDto } from "@invessiv/common/contracts/crm/conversation.dto";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import type { PendingThreadMessage } from "@invessiv/common/contracts/ui/pending-thread-message";
import {
  MESSAGE_DRAFT_STORAGE_KEY_PREFIX,
  MESSAGE_PENDING_STORAGE_KEY_PREFIX,
} from "@/common/constants/crm/message-draft-storage";
import type { ConversationThreadApi } from "@/common/contracts/crm/conversation-thread-api";
import { parseStoredPendingMessages } from "@/common/patterns/crm/parse-stored-pending-messages";
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

function withLatestPage<TConversation extends ConversationDto>(
  current: ThreadState<TConversation>,
  latest: TConversation,
): ThreadState<TConversation> {
  return {
    conversation: latest,
    messages: mergeThreadMessages(current.messages, latest.messages),
    nextCursor: current.extendedBack ? current.nextCursor : latest.nextCursor,
    extendedBack: current.extendedBack,
  };
}

function withOlderPage<TConversation extends ConversationDto>(
  current: ThreadState<TConversation>,
  older: TConversation,
): ThreadState<TConversation> {
  return {
    ...current,
    messages: mergeThreadMessages(current.messages, older.messages),
    nextCursor: older.nextCursor,
    extendedBack: true,
  };
}

function readStoredPendingMessages(storageKey: string): PendingThreadMessage[] {
  try {
    return parseStoredPendingMessages(
      JSON.parse(window.localStorage.getItem(storageKey) ?? "[]"),
    );
  } catch {
    // Blocked storage or broken JSON simply means nothing to restore.
    return [];
  }
}

function writeStoredPendingMessages(
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

function createPendingMessage(body: string): PendingThreadMessage {
  return {
    clientId: crypto.randomUUID(),
    body,
    createdAt: new Date().toISOString(),
    status: PendingMessageStatus.Sending,
  };
}

function replacePendingMessage(
  pending: readonly PendingThreadMessage[],
  clientId: string,
  replacement: PendingThreadMessage,
): PendingThreadMessage[] {
  return pending.map((item) =>
    item.clientId === clientId ? replacement : item,
  );
}

function withoutPendingMessage(
  pending: readonly PendingThreadMessage[],
  clientId: string,
): PendingThreadMessage[] {
  return pending.filter((item) => item.clientId !== clientId);
}

/** Keeps unsent messages of one viewer and conversation in local storage across reloads. */
function useStoredPendingMessages(storageKey: string) {
  const [pending, setPending] = useState<PendingThreadMessage[]>([]);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);

  useEffect(() => {
    setPending(readStoredPendingMessages(storageKey));
    setHydratedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    // Writing before the stored entries were read would wipe them.
    if (hydratedKey === storageKey)
      writeStoredPendingMessages(storageKey, pending);
  }, [hydratedKey, pending, storageKey]);

  return [pending, setPending] as const;
}

/** Newest page plus older pages loaded on request, merged into one chronological list. */
function useThreadPages<TConversation extends ConversationDto>(
  api: ConversationThreadApi<TConversation>,
  initialConversation: TConversation | null,
) {
  const [state, setState] = useState(() => stateFrom(initialConversation));
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderFailed, setOlderFailed] = useState(false);

  const reload = useCallback(async () => {
    const result = await api.getConversation(null);
    setLoadFailed(!result.ok);
    if (result.ok) setState((current) => withLatestPage(current, result.value));
  }, [api]);

  const loadOlder = useCallback(async () => {
    if (!state.nextCursor) return;
    setLoadingOlder(true);
    const result = await api.getConversation(state.nextCursor);
    setLoadingOlder(false);
    setOlderFailed(!result.ok);
    if (result.ok) setState((current) => withOlderPage(current, result.value));
  }, [api, state.nextCursor]);

  const replaceMessage = useCallback((message: MessageDto) => {
    setState((current) => ({
      ...current,
      messages: mergeThreadMessages(current.messages, [message]),
    }));
  }, []);

  return {
    state,
    loadFailed,
    loadingOlder,
    olderFailed,
    reload,
    loadOlder,
    replaceMessage,
  } as const;
}

/** Opening always shows the current state, even when the server prop is older. */
function useReloadWhileVisible(active: boolean, reload: () => Promise<void>) {
  useEffect(() => {
    if (!active) return;
    void reload();

    function reloadWhenTabReturns() {
      if (document.visibilityState === "visible") void reload();
    }

    document.addEventListener("visibilitychange", reloadWhenTabReturns);
    return () =>
      document.removeEventListener("visibilitychange", reloadWhenTabReturns);
  }, [active, reload]);
}

/**
 * Only a visible thread counts as read. Counters and badges come from the server render, so a
 * successful mark refreshes it.
 */
function useMarkReadWhileVisible<TConversation extends ConversationDto>(
  api: ConversationThreadApi<TConversation>,
  active: boolean,
  unreadCount: number,
  lastSeenMessageId: string | null,
  reload: () => Promise<void>,
) {
  const router = useRouter();
  const markingRead = useRef(false);
  const lastMarkedMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (
      !active ||
      unreadCount === 0 ||
      !lastSeenMessageId ||
      markingRead.current ||
      lastMarkedMessageId.current === lastSeenMessageId
    )
      return;
    markingRead.current = true;
    void api.markRead(lastSeenMessageId).then(async (result) => {
      markingRead.current = false;
      if (!result.ok) return;
      lastMarkedMessageId.current = lastSeenMessageId;
      await reload();
      router.refresh();
    });
  }, [active, api, lastSeenMessageId, reload, router, unreadCount]);
}

/** Shows a message right away, keeps it with "send again" on failure and confirms it on success. */
function useMessageSending<TConversation extends ConversationDto>(
  api: ConversationThreadApi<TConversation>,
  pending: readonly PendingThreadMessage[],
  setPending: Dispatch<SetStateAction<PendingThreadMessage[]>>,
  onDeliveredAction: (message: MessageDto) => void,
) {
  const [sendError, setSendError] = useState<MessageErrorCode | null>(null);

  const deliver = useCallback(
    async (entry: PendingThreadMessage) => {
      const result = await api.sendMessage({
        body: entry.body,
        clientMessageId: entry.clientId,
      });
      if (!result.ok) {
        setSendError(result.code);
        setPending((current) =>
          replacePendingMessage(current, entry.clientId, {
            ...entry,
            status: PendingMessageStatus.Failed,
          }),
        );
        return;
      }
      setSendError(null);
      setPending((current) => withoutPendingMessage(current, entry.clientId));
      onDeliveredAction(result.value);
    },
    [api, onDeliveredAction, setPending],
  );

  const send = useCallback(
    (body: string) => {
      const entry = createPendingMessage(body);
      setPending((current) => [...current, entry]);
      void deliver(entry);
    },
    [deliver, setPending],
  );

  const retry = useCallback(
    (clientId: string) => {
      const entry = pending.find((item) => item.clientId === clientId);
      if (!entry) return;
      const again = { ...entry, status: PendingMessageStatus.Sending };
      setPending((current) => replacePendingMessage(current, clientId, again));
      void deliver(again);
    },
    [deliver, pending, setPending],
  );

  return { sendError, send, retry } as const;
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
  const [pending, setPending] = useStoredPendingMessages(
    `${MESSAGE_PENDING_STORAGE_KEY_PREFIX}${storageScopeId}`,
  );
  const pages = useThreadPages(api, initialConversation);
  const { replaceMessage, reload } = pages;
  const confirmDelivery = useCallback(
    (message: MessageDto) => {
      replaceMessage(message);
      void reload();
    },
    [replaceMessage, reload],
  );
  const sending = useMessageSending(api, pending, setPending, confirmDelivery);
  // An own send may be newer than an unseen reply that has not been reloaded yet.
  const latestVisibleIncomingMessageId =
    pages.state.messages.findLast(
      (message) => message.type === MessageType.Text && !message.isOwn,
    )?.id ?? null;

  useReloadWhileVisible(active, reload);
  useMarkReadWhileVisible(
    api,
    active,
    pages.state.conversation?.unreadCount ?? 0,
    latestVisibleIncomingMessageId,
    reload,
  );

  const { loadOlder } = pages;
  const threadProps = {
    draftStorageKey: `${MESSAGE_DRAFT_STORAGE_KEY_PREFIX}${storageScopeId}`,
    hasOlder: pages.state.nextCursor !== null,
    loadingOlder: pages.loadingOlder,
    messages: pages.state.messages,
    onLoadOlderAction: () => void loadOlder(),
    onRetryAction: sending.retry,
    pending,
  } satisfies Partial<MessageThreadProps>;

  return {
    conversation: pages.state.conversation,
    loadFailed: pages.loadFailed,
    olderFailed: pages.olderFailed,
    /** Code of the last failed send; cleared by the next successful one. */
    sendError: sending.sendError,
    reload,
    send: sending.send,
    replaceMessage,
    /** Everything `MessageThread` needs from the thread state; texts come from the caller. */
    threadProps,
  } as const;
}
