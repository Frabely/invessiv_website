import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ReactNode } from "react";
import { useRef } from "react";
import { createPortal } from "react-dom";

import { useModalDialog } from "@/hooks/marketing/use-modal-dialog";
import styles from "./post-lightbox.module.css";

type PostLightboxProps = {
  open: boolean;
  onClose: () => void;
  closeLabel: string;
  ariaLabel: string;
  children: ReactNode;
};

export function PostLightbox({
  open,
  onClose,
  closeLabel,
  ariaLabel,
  children,
}: PostLightboxProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useModalDialog({
    dialogRef,
    initialFocusRef: closeButtonRef,
    onClose,
    open,
  });

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
