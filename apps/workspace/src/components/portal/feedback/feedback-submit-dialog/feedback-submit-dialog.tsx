"use client";

import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { ConfirmDialog } from "@invessiv/ui";
import type { FeedbackDraftItem } from "@/common/contracts/portal/feedback-draft-item";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import styles from "./feedback-submit-dialog.module.css";

export type FeedbackSubmitDialogProps = {
  busy: boolean;
  content: PortalFeedbackDictionary;
  error: string | null;
  items: readonly FeedbackDraftItem[];
  onCancelAction: () => void;
  onConfirmAction: () => void;
};

/** Last look before the round locks: how many points per area and how many files go out. */
export function FeedbackSubmitDialog({
  busy,
  content,
  error,
  items,
  onCancelAction,
  onConfirmAction,
}: FeedbackSubmitDialogProps) {
  const texts = content.submitDialog;
  const perArea = new Map<string, number>();
  for (const item of items) {
    const area = item.areaLabel ?? content.editor.general;
    perArea.set(area, (perArea.get(area) ?? 0) + 1);
  }
  const fileCount = items.reduce(
    (sum, item) => sum + item.attachments.length,
    0,
  );

  return (
    <ConfirmDialog
      busy={busy}
      cancelLabel={texts.cancel}
      closeLabel={texts.close}
      confirmLabel={texts.confirm}
      description={texts.description}
      onCancelAction={onCancelAction}
      onConfirmAction={onConfirmAction}
      title={texts.title}
    >
      <div className={styles.summary}>
        <p className={styles.total}>
          {formatCountMessage(items.length, {
            one: texts.itemsOne,
            many: texts.items,
          })}
        </p>
        <ul className={styles.areas}>
          {[...perArea].map(([area, count]) => (
            <li key={area}>
              <span>{area}</span>
              <span>
                {formatCountMessage(count, {
                  one: texts.itemsOne,
                  many: texts.items,
                })}
              </span>
            </li>
          ))}
        </ul>
        {fileCount > 0 ? (
          <p>
            {formatCountMessage(fileCount, {
              one: texts.filesOne,
              many: texts.files,
            })}
          </p>
        ) : null}
        <p className={styles.final}>{texts.final}</p>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </ConfirmDialog>
  );
}
