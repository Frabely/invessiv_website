"use client";

import type { ReactNode, RefObject } from "react";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import { ButtonControl, Dialog, PrimaryCtaButton } from "@invessiv/ui";

export type FileFormDialogProps = {
  busy: boolean;
  cancelLabel: string;
  closeLabel: string;
  description?: string;
  formId: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onCloseAction: () => void;
  size?: DialogSize;
  submitLabel: string;
  submittingLabel: string;
  title: string;
  children: ReactNode;
};

/** Shared narrow dialog frame and footer for create/edit file forms. */
export function FileFormDialog({
  busy,
  cancelLabel,
  closeLabel,
  description,
  formId,
  initialFocusRef,
  onCloseAction,
  size = DialogSize.Narrow,
  submitLabel,
  submittingLabel,
  title,
  children,
}: FileFormDialogProps) {
  return (
    <Dialog
      busy={busy}
      closeLabel={closeLabel}
      description={description}
      footer={
        <>
          <ButtonControl
            disabled={busy}
            onClick={onCloseAction}
            type="button"
            variant="ghost"
          >
            {cancelLabel}
          </ButtonControl>
          <PrimaryCtaButton disabled={busy} form={formId} type="submit">
            {busy ? submittingLabel : submitLabel}
          </PrimaryCtaButton>
        </>
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
