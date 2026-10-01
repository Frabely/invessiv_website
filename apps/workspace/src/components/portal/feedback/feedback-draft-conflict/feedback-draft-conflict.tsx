"use client";

import { useState } from "react";
import { ButtonControl } from "@invessiv/ui";
import type { FeedbackDraftItem } from "@/common/contracts/portal/feedback-draft-item";
import { feedbackDraftItems } from "@/common/patterns/portal/feedback-draft-items";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import styles from "./feedback-draft-conflict.module.css";

export type FeedbackDraftConflictProps = {
  /** The own points that were not saved when another contact saved. */
  items: readonly FeedbackDraftItem[];
  onDismissAction: () => void;
  onRestoreAction: () => void;
  texts: PortalFeedbackDictionary["draft"]["conflict"];
};

/** After a parallel save of another contact: the way back to the own text. An alert. */
export function FeedbackDraftConflict({
  items,
  onDismissAction,
  onRestoreAction,
  texts,
}: FeedbackDraftConflictProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        feedbackDraftItems.toPlainText(items),
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.conflict} role="alert">
      <p className={styles.conflictTitle}>{texts.title}</p>
      <p>{texts.description}</p>
      <div className={styles.conflictActions}>
        <ButtonControl onClick={onRestoreAction} type="button">
          {texts.restore}
        </ButtonControl>
        <ButtonControl
          onClick={() => void copy()}
          type="button"
          variant="ghost"
        >
          {copied ? texts.copied : texts.copy}
        </ButtonControl>
        <ButtonControl onClick={onDismissAction} type="button" variant="ghost">
          {texts.dismiss}
        </ButtonControl>
      </div>
    </div>
  );
}
