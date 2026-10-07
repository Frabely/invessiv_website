import { useCallback, useEffect, useRef, useState } from "react";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { RevealedSecretStatus } from "@/common/constants/credentials/revealed-secret-status";
import type { CredentialRevealOutcome } from "@/common/contracts/credentials/credential-reveal-outcome";

type RevealedSecretState = {
  status: RevealedSecretStatus;
  /** Set only while `Visible`. A copied value never passes through here. */
  value: string | null;
  edited: boolean;
  secondsLeft: number;
  /** Why the last request failed, ready to show. */
  message: string | null;
  /** True for a moment after a successful copy. */
  copied: boolean;
};

const HIDDEN: RevealedSecretState = {
  status: RevealedSecretStatus.Hidden,
  value: null,
  edited: false,
  secondsLeft: 0,
  message: null,
  copied: false,
};
const COPIED_FEEDBACK_MS = 2000;

function isInBackground() {
  return document.visibilityState === "hidden";
}

/**
 * Holds one revealed value for a limited time. The value leaves the state when the countdown ends,
 * when the tab goes to the background and when the component unmounts. Copying requests the value
 * again with its own intent and hands it to the clipboard without ever storing it.
 */
export function useRevealedSecret(options: {
  autoHideSeconds: number;
  clipboardFailedMessage: string;
  reveal: (intent: CredentialRevealIntent) => Promise<CredentialRevealOutcome>;
}) {
  const { autoHideSeconds, clipboardFailedMessage, reveal } = options;
  const [state, setState] = useState<RevealedSecretState>(HIDDEN);
  // Bumped on hide and unmount, so an answer that arrives late is dropped instead of shown.
  const requestRef = useRef(0);
  const copyRequestRef = useRef(0);
  const deadlineRef = useRef(0);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isVisible = state.status === RevealedSecretStatus.Visible;

  const hide = useCallback(() => {
    requestRef.current += 1;
    copyRequestRef.current += 1;
    deadlineRef.current = 0;
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    setState(HIDDEN);
  }, []);

  // A tab can leave the foreground while a reveal is still loading.
  useEffect(() => {
    const hideInBackground = () => {
      if (isInBackground()) hide();
    };
    document.addEventListener("visibilitychange", hideInBackground);
    return () => {
      document.removeEventListener("visibilitychange", hideInBackground);
      requestRef.current += 1;
      copyRequestRef.current += 1;
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, [hide]);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      const secondsLeft = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000),
      );
      if (secondsLeft === 0) {
        hide();
        return;
      }
      setState((current) =>
        current.status !== RevealedSecretStatus.Visible
          ? current
          : { ...current, secondsLeft },
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [isVisible, hide]);

  async function show() {
    if (isInBackground()) return;
    const request = (requestRef.current += 1);
    setState({ ...HIDDEN, status: RevealedSecretStatus.Loading });
    const outcome = await reveal(CredentialRevealIntent.Show);
    if (request !== requestRef.current || isInBackground()) return;
    deadlineRef.current = outcome.ok ? Date.now() + autoHideSeconds * 1000 : 0;
    setState(
      outcome.ok
        ? {
            ...HIDDEN,
            status: RevealedSecretStatus.Visible,
            value: outcome.value,
            secondsLeft: autoHideSeconds,
          }
        : {
            ...HIDDEN,
            status: RevealedSecretStatus.Failed,
            message: outcome.message,
          },
    );
  }

  /** Works without showing first; a value that is visible meanwhile stays visible. */
  async function copy() {
    if (isInBackground()) return;
    const request = requestRef.current;
    const copyRequest = (copyRequestRef.current += 1);
    const outcome = await reveal(CredentialRevealIntent.Copy);
    const isCurrent = () =>
      request === requestRef.current &&
      copyRequest === copyRequestRef.current &&
      !isInBackground();
    // Check before the clipboard side effect, not just before updating feedback.
    if (!isCurrent()) return;
    let message: string | null = outcome.ok ? null : outcome.message;
    if (outcome.ok) {
      try {
        await navigator.clipboard.writeText(outcome.value);
      } catch {
        message = clipboardFailedMessage;
      }
    }
    if (!isCurrent()) return;
    if (message !== null) {
      setState({ ...HIDDEN, status: RevealedSecretStatus.Failed, message });
      return;
    }
    setState((current) => ({ ...current, message: null, copied: true }));
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(
      () => setState((current) => ({ ...current, copied: false })),
      COPIED_FEEDBACK_MS,
    );
  }

  function edit(value: string) {
    setState((current) =>
      current.status === RevealedSecretStatus.Visible
        ? { ...current, value, edited: true }
        : current,
    );
  }

  /** A conflict invalidates stored values, but an edited draft keeps its original deadline. */
  function discardUnedited() {
    requestRef.current += 1;
    copyRequestRef.current += 1;
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    setState((current) =>
      current.status === RevealedSecretStatus.Visible &&
      current.edited &&
      deadlineRef.current > Date.now() &&
      !isInBackground()
        ? { ...current, copied: false }
        : HIDDEN,
    );
  }

  return { ...state, show, hide, copy, edit, discardUnedited };
}
