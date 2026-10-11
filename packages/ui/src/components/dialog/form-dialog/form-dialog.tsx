"use client";

import type { ReactNode, RefObject } from "react";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import { ButtonControl, PrimaryCtaButton } from "../../button/button";
import { Dialog } from "../dialog/dialog";
import styles from "./form-dialog.module.css";

export type FormDialogProps = {
  busy: boolean;
  cancelLabel: string;
  closeLabel: string;
  description?: string;
  formId: string;
  footerHint?: string;
  footer?: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onCloseAction: () => void;
  size?: DialogSize;
  submitLabel: string;
  submittingLabel: string;
  submitDisabled?: boolean;
  title: string;
  children: ReactNode;
};

/** Narrow dialog frame whose footer submits the form named by `formId`. */
export function FormDialog({
  busy,
  cancelLabel,
  closeLabel,
  description,
  formId,
  footerHint,
  footer,
  initialFocusRef,
  onCloseAction,
  size = DialogSize.Narrow,
  submitLabel,
  submittingLabel,
  submitDisabled = false,
  title,
  children,
}: FormDialogProps) {
  return (
    <Dialog
      busy={busy}
      closeLabel={closeLabel}
      description={description}
      footer={
        footer ?? (
          <>
            {footerHint ? (
              <p className={styles.footerRequiredHint}>{footerHint}</p>
            ) : null}
            <div className={styles.footerActions}>
              <ButtonControl
                disabled={busy}
                onClick={onCloseAction}
                type="button"
                variant="ghost"
              >
                {cancelLabel}
              </ButtonControl>
              <PrimaryCtaButton
                disabled={busy || submitDisabled}
                form={formId}
                type="submit"
              >
                {busy ? submittingLabel : submitLabel}
              </PrimaryCtaButton>
            </div>
          </>
        )
      }
      initialFocusRef={initialFocusRef}
      onCloseAction={onCloseAction}
      size={size}
      title={title}
    >
      {children}
    </Dialog>
  );
}
