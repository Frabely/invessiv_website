"use client";

import { useId, useState } from "react";
import {
  ButtonControl,
  CheckboxControl,
  Dialog,
  DialogSize,
  PrimaryCtaButton,
} from "@invessiv/ui";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import styles from "./feedback-approve-dialog.module.css";

export type FeedbackApproveDialogProps = {
  busy: boolean;
  /** The shortcut and the final approval word the same step differently. */
  texts: PortalFeedbackDictionary["approveDialog"];
  error: string | null;
  /** Other rounds would expire; the text says so only when there are any. */
  hasRemainingRounds: boolean;
  onCancelAction: () => void;
  onConfirmAction: () => void;
};

/**
 * The final approval. The button stays disabled until the customer ticks the confirmation, and
 * the request carries `confirmFinal` only then; the server refuses without it.
 */
export function FeedbackApproveDialog({
  busy,
  texts,
  error,
  hasRemainingRounds,
  onCancelAction,
  onConfirmAction,
}: FeedbackApproveDialogProps) {
  const checkboxId = useId();
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Dialog
      busy={busy}
      closeLabel={texts.close}
      description={
        hasRemainingRounds ? texts.description : texts.descriptionLast
      }
      footer={
        <>
          <ButtonControl
            disabled={busy}
            onClick={onCancelAction}
            type="button"
            variant="ghost"
          >
            {texts.cancel}
          </ButtonControl>
          <PrimaryCtaButton
            disabled={!confirmed || busy}
            onClick={onConfirmAction}
            type="button"
          >
            {texts.confirm}
          </PrimaryCtaButton>
        </>
      }
      onCloseAction={onCancelAction}
      size={DialogSize.Narrow}
      title={texts.title}
    >
      <div className={styles.body}>
        <label className={styles.confirm} htmlFor={checkboxId}>
          <CheckboxControl
            checked={confirmed}
            disabled={busy}
            id={checkboxId}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          <span>{texts.checkbox}</span>
        </label>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
