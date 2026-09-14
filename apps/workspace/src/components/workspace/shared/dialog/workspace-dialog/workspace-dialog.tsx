"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { WorkspaceDialogSize } from "@/common/constants/ui/workspace-dialog-sizes";
import { ButtonControl } from "@invessiv/ui";
import {
  focusFirstDialogElement,
  getFocusableElements,
  trapDialogFocus,
} from "@/components/workspace/shared/dialog/dialog-focus-trap";
import styles from "./workspace-dialog.module.css";

type WorkspaceDialogProps = {
  /** Blocks closing while a request is running, so a result never lands in a closed dialog. */
  busy?: boolean;
  children?: ReactNode;
  closeLabel: string;
  description?: string;
  footer: ReactNode;
  onCloseAction: () => void;
  size: WorkspaceDialogSize;
  title: string;
};

export function WorkspaceDialog({
  busy = false,
  children,
  closeLabel,
  description,
  footer,
  onCloseAction,
  size,
  title,
}: WorkspaceDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const frame = window.requestAnimationFrame(() => {
      const body = bodyRef.current;
      focusFirstDialogElement(
        body && getFocusableElements(body).length > 0
          ? body
          : dialogRef.current,
      );
    });

    return () => {
      window.cancelAnimationFrame(frame);
      trigger?.focus();
    };
  }, []);

  function requestClose() {
    if (!busy) {
      onCloseAction();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    trapDialogFocus(event, dialogRef.current, requestClose);
  }

  function handleOverlayMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      requestClose();
    }
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={handleOverlayMouseDown}
      role="presentation"
    >
      <div
        aria-busy={busy ? "true" : undefined}
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.dialog}
        data-size={size}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div className={styles.heading}>
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
          <div className={styles.body} ref={bodyRef}>
            {children}
          </div>
        ) : null}
        <footer className={styles.footer}>{footer}</footer>
      </div>
    </div>,
    document.body,
  );
}
