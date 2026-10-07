"use client";

import { useCallback, useEffect, useRef } from "react";

/** Restores focus after a dialog and its data reload, using stable identities rather than labels. */
export function useDialogReturnFocus(options: {
  dialogOpen: boolean;
  ready: boolean;
}) {
  const { dialogOpen, ready } = options;
  const targetsRef = useRef(new Map<string, HTMLButtonElement>());
  const fallbackRef = useRef<HTMLButtonElement | null>(null);
  const returnToRef = useRef<string | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (dialogOpen || !ready || !pendingRef.current) return;
    pendingRef.current = false;
    const target = returnToRef.current
      ? targetsRef.current.get(returnToRef.current)
      : undefined;
    const available = target && !target.disabled ? target : fallbackRef.current;
    available?.focus();
  }, [dialogOpen, ready]);

  const targetRef = useCallback(
    (key: string) => (button: HTMLButtonElement | null) => {
      if (button) targetsRef.current.set(key, button);
      else targetsRef.current.delete(key);
    },
    [],
  );

  function rememberTarget(key: string) {
    returnToRef.current = key;
    pendingRef.current = false;
  }

  function restoreAfterReload() {
    pendingRef.current = true;
  }

  return { targetRef, fallbackRef, rememberTarget, restoreAfterReload };
}
