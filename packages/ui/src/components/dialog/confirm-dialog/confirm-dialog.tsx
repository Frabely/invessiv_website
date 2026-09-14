"use client";

import type { ReactNode } from "react";
import { ButtonControl } from "../../button/button";
import { Dialog } from "../dialog/dialog";
import styles from "./confirm-dialog.module.css";

export type ConfirmDialogProps = {
  busy?: boolean;
  cancelLabel: string;
  children?: ReactNode;
  closeLabel: string;
  confirmLabel: string;
  description: string;
  onCancelAction: () => void;
  onConfirmAction: () => void;
  secondaryAction?: ReactNode;
  title: string;
  tone?: "default" | "danger";
};

export function ConfirmDialog({
  busy = false,
  cancelLabel,
  children,
  closeLabel,
  confirmLabel,
  description,
  onCancelAction,
  onConfirmAction,
  secondaryAction,
  title,
  tone = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog
      busy={busy}
      closeLabel={closeLabel}
      description={description}
      footer={
        <>
          <ButtonControl
            disabled={busy}
            onClick={onCancelAction}
            type="button"
            variant="ghost"
          >
            {cancelLabel}
          </ButtonControl>
          {secondaryAction}
          <button
            className={styles.confirmButton}
            data-tone={tone}
            disabled={busy}
            onClick={onConfirmAction}
            type="button"
          >
            {confirmLabel}
          </button>
        </>
      }
      onCloseAction={onCancelAction}
      size="narrow"
      title={title}
    >
      {children}
    </Dialog>
  );
}
