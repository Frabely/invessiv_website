"use client";

import {
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
  description?: string;
  footer: ReactNode;
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
  description,
  footer,
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

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      queueMicrotask(() => initialFocusRef?.current?.focus());
    }
    if (!open && dialog.open) closeDialogElement(dialog);
  }, [initialFocusRef, open]);

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
      onCancel={handleCancel}
      onMouseDown={handleMouseDown}
      ref={(element) => {
        dialogRef.current = element;
        setPortalRoot(element);
      }}
    >
      <DialogPortalRootContext.Provider value={portalRoot}>
        <div className={styles.surface} data-size={size}>
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
          {children ? <div className={styles.body}>{children}</div> : null}
          <footer className={styles.footer}>{footer}</footer>
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
