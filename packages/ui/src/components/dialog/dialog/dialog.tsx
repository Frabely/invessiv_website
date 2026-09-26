"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import { ButtonControl } from "../../button/button";
import { DialogPortalRootContext } from "../dialog-portal-root-context";
import styles from "./dialog.module.css";

export type DialogProps = {
  busy?: boolean;
  children?: ReactNode;
  closeLabel: string;
  closeOnBackdropClick?: boolean;
  className?: string;
  description?: string;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onCloseAction: () => void;
  open?: boolean;
  size: DialogSize;
  title: string;
};

export function Dialog({
  busy = false,
  children,
  closeLabel,
  closeOnBackdropClick = true,
  className,
  description,
  eyebrow,
  footer,
  bodyClassName,
  initialFocusRef,
  onCloseAction,
  open = true,
  size,
  title,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLDialogElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  // A full-size dialog fills only the content area, so the app header and sidebar stay usable next to it.
  const modal = size !== DialogSize.Full;

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const openElement = modal ? dialog.showModal : dialog.show;
      if (typeof openElement === "function") {
        openElement.call(dialog);
      } else {
        dialog.setAttribute("open", "");
      }
      queueMicrotask(() => initialFocusRef?.current?.focus());
    }
    if (!open && dialog.open) closeDialogElement(dialog);
  }, [initialFocusRef, modal, open]);

  useLayoutEffect(
    () => () => {
      if (dialogRef.current) closeDialogElement(dialogRef.current);
    },
    [],
  );

  function requestClose() {
    if (!busy) onCloseAction();
  }

  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    requestClose();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    // Nested dialogs bubble through the React tree; the innermost one already handled the key.
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      requestClose();
      return;
    }

    if (!modal || event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button, input, select, textarea, a[href]",
      ),
    ).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length < 2) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleMouseDown(event: MouseEvent<HTMLDialogElement>) {
    if (closeOnBackdropClick && event.target === event.currentTarget)
      requestClose();
  }

  return (
    <dialog
      aria-busy={busy || undefined}
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={styles.dialog}
      data-size={size}
      onCancel={handleCancel}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      ref={(element) => {
        dialogRef.current = element;
        setPortalRoot(element);
      }}
    >
      <DialogPortalRootContext.Provider value={portalRoot}>
        <div
          className={
            className ? `${styles.surface} ${className}` : styles.surface
          }
          data-size={size}
        >
          <header className={styles.header}>
            <div className={styles.heading}>
              {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
              <h2 className={styles.title} id={titleId}>
                {title}
              </h2>
              {description ? (
                <p className={styles.description} id={descriptionId}>
                  {description}
                </p>
              ) : null}
            </div>
            <ButtonControl
              aria-label={closeLabel}
              className={styles.closeButton}
              disabled={busy}
              onClick={requestClose}
              title={closeLabel}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
            </ButtonControl>
          </header>
          {children ? (
            <div
              className={
                bodyClassName ? `${styles.body} ${bodyClassName}` : styles.body
              }
            >
              {children}
            </div>
          ) : null}
          {footer ? <footer className={styles.footer}>{footer}</footer> : null}
        </div>
      </DialogPortalRootContext.Provider>
    </dialog>
  );
}

function closeDialogElement(dialog: HTMLDialogElement) {
  if (typeof dialog.close === "function") {
    dialog.close();
  } else {
    dialog.removeAttribute("open");
  }
}
