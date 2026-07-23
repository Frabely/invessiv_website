import type { RefObject } from "react";
import { useEffect } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab focus inside the dialog while it is open. */
function trapFocus(dialog: HTMLElement, event: KeyboardEvent) {
  if (event.key !== "Tab") {
    return;
  }

  const focusable = Array.from(
    dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => element.offsetParent !== null || element === dialog);

  if (focusable.length === 0) {
    event.preventDefault();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

type ModalDialogOptions = {
  dialogRef: RefObject<HTMLElement | null>;
  /** Receives focus when the dialog opens, usually the close button. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  open: boolean;
  /**
   * Receives focus once the dialog closes. A ref rather than a callback,
   * because tapping a control does not focus it on iOS Safari — reading
   * `document.activeElement` on open would restore focus to the wrong place.
   */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

/**
 * Shared behaviour for the app's modal dialogs: focus trap, Escape to close,
 * scroll lock, and focus handover on open and close. Rendering, markup and
 * animation stay with the individual dialog.
 */
export function useModalDialog({
  dialogRef,
  initialFocusRef,
  onClose,
  open,
  returnFocusRef,
}: ModalDialogOptions) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const returnFocusTarget = returnFocusRef?.current;

    initialFocusRef?.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (dialogRef.current) {
        trapFocus(dialogRef.current, event);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    const root = document.documentElement;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    const previousOverflow = root.style.overflow;
    const previousPaddingRight = root.style.paddingRight;
    root.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      root.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      root.style.overflow = previousOverflow;
      root.style.paddingRight = previousPaddingRight;
      returnFocusTarget?.focus();
    };
  }, [dialogRef, initialFocusRef, onClose, open, returnFocusRef]);
}
