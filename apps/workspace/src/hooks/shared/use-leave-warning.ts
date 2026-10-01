"use client";

import { useEffect } from "react";

/**
 * Warns before unsaved input is lost: the browser's own prompt on reload or close, and a
 * confirmation before a same-tab link click (client navigation never fires `beforeunload`).
 */
export function useLeaveWarning(hasUnsaved: boolean, message: string) {
  useEffect(() => {
    if (!hasUnsaved) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    function guardLink(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      const anchor =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", guardLink, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", guardLink, true);
    };
  }, [hasUnsaved, message]);
}
