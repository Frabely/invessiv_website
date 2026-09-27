"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

const BOTTOM_TOLERANCE_PX = 48;

type ScrollSnapshot = { firstKey: string | null; lastKey: string | null };

/**
 * Keeps a chat log pinned to its end while the reader is there. Reading further up is never
 * interrupted: new rows then only raise `hasUnseen`, and prepending older rows keeps the visible
 * row in place.
 */
export function useThreadAutoscroll(
  firstKey: string | null,
  lastKey: string | null,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previous = useRef<ScrollSnapshot | null>(null);
  const previousHeight = useRef(0);
  const nearBottom = useRef(true);
  const forceBottom = useRef(false);
  const [hasUnseen, setHasUnseen] = useState(false);

  const pinToBottom = useCallback(() => {
    const element = containerRef.current;
    if (element) element.scrollTop = element.scrollHeight;
    nearBottom.current = true;
  }, []);

  const scrollToBottom = useCallback(() => {
    pinToBottom();
    setHasUnseen(false);
  }, [pinToBottom]);

  const onScroll = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;
    nearBottom.current =
      element.scrollHeight - element.scrollTop - element.clientHeight <=
      BOTTOM_TOLERANCE_PX;
    if (nearBottom.current) setHasUnseen(false);
  }, []);

  /** The viewer's own send always lands in view, even when they were reading further up. */
  const stickToBottomOnNextChange = useCallback(() => {
    forceBottom.current = true;
  }, []);

  useLayoutEffect(() => {
    const element = containerRef.current;
    const before = previous.current;
    previous.current = { firstKey, lastKey };
    if (!element) return;
    const heightBefore = previousHeight.current;
    previousHeight.current = element.scrollHeight;

    // Scrolling fires onScroll, which clears the hint; only the "missed" case sets state, and it
    // does so in the next frame so layout work never cascades into another render.
    if (!before || forceBottom.current) {
      forceBottom.current = false;
      pinToBottom();
      return;
    }
    if (before.lastKey === lastKey && before.firstKey !== firstKey) {
      element.scrollTop += element.scrollHeight - heightBefore;
      return;
    }
    if (before.lastKey === lastKey) return;
    if (nearBottom.current) {
      pinToBottom();
      return;
    }
    const frame = requestAnimationFrame(() => setHasUnseen(true));
    return () => cancelAnimationFrame(frame);
  }, [firstKey, lastKey, pinToBottom]);

  return {
    containerRef,
    hasUnseen,
    onScroll,
    scrollToBottom,
    stickToBottomOnNextChange,
  } as const;
}
