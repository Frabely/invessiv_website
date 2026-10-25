"use client";

import type { ReactNode } from "react";
import { PrimaryCtaButton, SecondaryCtaButton } from "../../button/button";
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
          <SecondaryCtaButton
            disabled={busy}
            onClick={onCancelAction}
            type="button"
          >
            {cancelLabel}
          </SecondaryCtaButton>
          {secondaryAction}
          {tone === "danger" ? (
            <button
              className={styles.dangerButton}
              disabled={busy}
              onClick={onConfirmAction}
              type="button"
            >
              {confirmLabel}
            </button>
          ) : (
            <PrimaryCtaButton
              disabled={busy}
              onClick={onConfirmAction}
              type="button"
            >
              {confirmLabel}
            </PrimaryCtaButton>
          )}
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
