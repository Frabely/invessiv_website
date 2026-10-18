"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { UrlSearchEvent } from "@/common/constants/shared/url-search-events";
import type { UrlHistoryChange } from "@/common/contracts/hooks/url-history-change";
import { subscribeUrlHistory } from "@/lib/navigation/url-history-dispatcher";

type SearchSubscription = {
  onChange: () => void;
  localParams?: readonly string[];
  preservesFields?: boolean;
};

/**
 * Indices count from the entry where a store session started, so they only describe distances
 * between entries of the same session. Another page starts its own session at 0.
 */
type HistoryPosition = { session: string; index: number };

type HistorySnapshot = {
  url: URL;
  state: unknown;
  position: HistoryPosition | null;
};

type HistoryGuard = (change: UrlHistoryChange) => string | null;

const HISTORY_INDEX = "__invessivUrlIndex";
const HISTORY_SESSION = "__invessivUrlSession";
const subscriptions = new Set<SearchSubscription>();
const guards = new Set<HistoryGuard>();
let previous: HistorySnapshot | null = null;
let returning = false;
let unsubscribeHistory: (() => void) | null = null;

function historyPosition(state: unknown): HistoryPosition | null {
  if (!state || typeof state !== "object") return null;
  const index = (state as Record<string, unknown>)[HISTORY_INDEX];
  const session = (state as Record<string, unknown>)[HISTORY_SESSION];
  return typeof index === "number" &&
    Number.isSafeInteger(index) &&
    typeof session === "string" &&
    session.length > 0
    ? { session, index }
    : null;
}

function withPosition(state: unknown, position: HistoryPosition | null) {
  return {
    ...(state && typeof state === "object" ? state : {}),
    ...(position === null
      ? {}
      : {
          [HISTORY_INDEX]: position.index,
          [HISTORY_SESSION]: position.session,
        }),
  };
}

function startSession(): HistoryPosition {
  return { session: crypto.randomUUID(), index: 0 };
}

function samePosition(a: HistoryPosition | null, b: HistoryPosition | null) {
  return a?.session === b?.session && a?.index === b?.index;
}

/** How far `history.go` must travel back to `from`; null when the two entries share no session. */
function returnDelta(from: HistoryPosition | null, to: HistoryPosition | null) {
  if (!from || !to || from.session !== to.session) return null;
  return from.index - to.index || null;
}

function snapshot(): HistorySnapshot {
  return {
    url: new URL(window.location.href),
    state: window.history.state,
    position: historyPosition(window.history.state),
  };
}

function notify() {
  previous = snapshot();
  for (const subscription of subscriptions) subscription.onChange();
}

function serverSearch(url: URL, localParams: readonly string[]) {
  const params = new URLSearchParams(url.search);
  for (const param of localParams) params.delete(param);
  params.sort();
  return params.toString();
}

function localStep(from: URL, to: URL) {
  if (
    from.pathname !== to.pathname ||
    from.hash !== to.hash ||
    from.search === to.search
  )
    return undefined;
  return [...subscriptions].find(
    ({ localParams }) =>
      localParams &&
      serverSearch(from, localParams) === serverSearch(to, localParams),
  );
}

function onHistoryChange(event: PopStateEvent) {
  const next = snapshot();
  if (!previous) return notify();
  if (returning) {
    // The rejected traversal never reached React or Next; its return must not do so either.
    event.stopImmediatePropagation();
    if (
      next.url.href === previous.url.href &&
      samePosition(next.position, previous.position)
    ) {
      returning = false;
      notify();
    }
    return;
  }
  const step = localStep(previous.url, next.url);
  const change: UrlHistoryChange = {
    previousUrl: previous.url,
    nextUrl: next.url,
    preservesFields: step?.preservesFields === true,
  };
  // All guards run before local-step interception, regardless of effect registration order.
  const warnings = new Set([...guards].map((guard) => guard(change)));
  for (const warning of warnings) {
    if (warning === null || window.confirm(warning)) continue;
    event.stopImmediatePropagation();
    const delta = returnDelta(previous.position, next.position);
    if (delta) {
      returning = true;
      window.history.go(delta);
    } else {
      // Entries of another session or created outside this store have no reliable distance.
      // Restore the mounted URL in place rather than travelling to a wrong entry.
      window.history.replaceState(previous.state, "", previous.url);
      notify();
    }
    return;
  }
  if (step) {
    // Next can remount a form when restoring an older router tree. Keep the mounted tree,
    // then synchronize its canonical URL through Next's patched History API.
    event.stopImmediatePropagation();
    window.history.replaceState(
      withPosition(previous.state, next.position),
      "",
      next.url,
    );
    window.history.replaceState(
      withPosition(null, next.position),
      "",
      next.url,
    );
  }
  notify();
}

function connect() {
  if (previous) return;
  if (historyPosition(window.history.state) === null)
    window.history.replaceState(
      withPosition(window.history.state, startSession()),
      "",
    );
  previous = snapshot();
  unsubscribeHistory = subscribeUrlHistory(onHistoryChange);
  window.addEventListener(UrlSearchEvent.Changed, notify);
}

function disconnect() {
  if (subscriptions.size || guards.size) return;
  unsubscribeHistory?.();
  unsubscribeHistory = null;
  window.removeEventListener(UrlSearchEvent.Changed, notify);
  previous = null;
  returning = false;
}

function currentSearch() {
  return window.location.search.slice(1);
}

function write(update: (params: URLSearchParams) => void, push: boolean) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  update(params);
  url.search = params.toString();
  const position = historyPosition(window.history.state) ?? startSession();
  // Pass only our metadata; Next's History wrapper supplies its own router state.
  if (push)
    window.history.pushState(
      withPosition(null, { ...position, index: position.index + 1 }),
      "",
      url,
    );
  else window.history.replaceState(withPosition(null, position), "", url);
  window.dispatchEvent(new Event(UrlSearchEvent.Changed));
}

/** Shared URL snapshot and local query writes; domain-specific parsing stays with the caller. */
export function useUrlSearch(
  options: {
    initialSearch?: string;
    /** Parameters owned by a local step view, restored without remounting its page. */
    localParams?: readonly string[];
    preservesFields?: boolean;
  } = {},
) {
  const searchParams = useSearchParams();
  const { initialSearch, localParams, preservesFields } = options;
  const subscribe = useCallback(
    (onChange: () => void) => {
      connect();
      const subscription = { onChange, localParams, preservesFields };
      subscriptions.add(subscription);
      return () => {
        subscriptions.delete(subscription);
        disconnect();
      };
    },
    [localParams, preservesFields],
  );
  const search = useSyncExternalStore(
    subscribe,
    currentSearch,
    () => initialSearch ?? searchParams.toString(),
  );
  const push = useCallback(
    (update: (params: URLSearchParams) => void) => write(update, true),
    [],
  );
  const replace = useCallback(
    (update: (params: URLSearchParams) => void) => write(update, false),
    [],
  );
  return {
    search,
    push,
    replace,
    synchronized: searchParams.toString() === search,
  };
}

/** Joins the same history dispatcher as query views, before any of them update React. */
export function useUrlHistoryGuard(guard: HistoryGuard | null) {
  useEffect(() => {
    if (!guard) return;
    connect();
    guards.add(guard);
    return () => {
      guards.delete(guard);
      disconnect();
    };
  }, [guard]);
}
