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

type HistorySnapshot = {
  url: URL;
  state: unknown;
  index: number | null;
};

type HistoryGuard = (change: UrlHistoryChange) => string | null;

const HISTORY_INDEX = "__invessivUrlIndex";
const subscriptions = new Set<SearchSubscription>();
const guards = new Set<HistoryGuard>();
let previous: HistorySnapshot | null = null;
let returning = false;
let unsubscribeHistory: (() => void) | null = null;

function historyIndex(state: unknown): number | null {
  if (!state || typeof state !== "object" || !(HISTORY_INDEX in state))
    return null;
  const value = state[HISTORY_INDEX];
  return typeof value === "number" && Number.isSafeInteger(value)
    ? value
    : null;
}

function withIndex(state: unknown, index: number | null) {
  return {
    ...(state && typeof state === "object" ? state : {}),
    ...(index === null ? {} : { [HISTORY_INDEX]: index }),
  };
}

function snapshot(): HistorySnapshot {
  return {
    url: new URL(window.location.href),
    state: window.history.state,
    index: historyIndex(window.history.state),
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
    if (next.url.href === previous.url.href && next.index === previous.index) {
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
    const delta =
      previous.index !== null && next.index !== null
        ? previous.index - next.index
        : null;
    if (delta) {
      returning = true;
      window.history.go(delta);
    } else {
      // Entries created outside this store have no reliable direction. Restore the mounted
      // URL in place rather than guessing forward and potentially leaving the page again.
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
      withIndex(previous.state, next.index),
      "",
      next.url,
    );
    window.history.replaceState(withIndex(null, next.index), "", next.url);
  }
  notify();
}

function connect() {
  if (previous) return;
  if (historyIndex(window.history.state) === null)
    window.history.replaceState(withIndex(window.history.state, 0), "");
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
  const index = historyIndex(window.history.state) ?? 0;
  if (push) window.history.pushState(withIndex(null, index + 1), "", url);
  else
    window.history.replaceState(
      withIndex(window.history.state, index),
      "",
      url,
    );
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
