import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./post-lightbox.module.css";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

type PostLightboxProps = {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
  ariaLabel: string;
  children: ReactNode;
};

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

export function PostLightbox({
  open,
  onClose,
  closeLabel,
  ariaLabel,
  children,
}: PostLightboxProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    closeButtonRef.current?.focus();

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

    // Lock scrolling on the documentElement: `body { overflow-x: hidden }`
    // makes <html> the actual scroll container, so locking <body> alone has no
    // effect. Compensate the now-missing scrollbar width to avoid a layout jump.
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
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        aria-label={ariaLabel}
        aria-modal="true"
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <button
          aria-label={closeLabel}
          className={styles.close}
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
        </button>
        <div className={styles.content}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
