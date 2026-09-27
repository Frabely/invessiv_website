"use client";

import { useCallback, useSyncExternalStore } from "react";

// Memory is the source of truth so typing keeps working when storage is blocked; storage only
// makes the draft survive a reload.
const memoryDrafts = new Map<string, string>();
const listeners = new Set<() => void>();

function readStoredDraft(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStoredDraft(key: string, value: string) {
  try {
    if (value) window.localStorage.setItem(key, value);
    else window.localStorage.removeItem(key);
  } catch {
    // Blocked or full storage: the draft simply does not survive a reload.
  }
}

function readDraft(key: string): string {
  const cached = memoryDrafts.get(key);
  if (cached !== undefined) return cached;
  const stored = readStoredDraft(key);
  memoryDrafts.set(key, stored);
  return stored;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Keeps the unsent text under `storageKey` across reloads; storage failures never throw. */
export function useMessageDraft(storageKey: string) {
  const draft = useSyncExternalStore(
    subscribe,
    () => readDraft(storageKey),
    () => "",
  );

  const setDraft = useCallback(
    (value: string) => {
      memoryDrafts.set(storageKey, value);
      writeStoredDraft(storageKey, value);
      listeners.forEach((listener) => listener());
    },
    [storageKey],
  );

  return [draft, setDraft] as const;
}
