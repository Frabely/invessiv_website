"use client";

import type { ReactNode } from "react";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FeedbackReadOnlyItemContent } from "@/components/shared/feedback/feedback-read-only-item-content/feedback-read-only-item-content";
import type { CrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./feedback-item-row.module.css";

type FeedbackItemRowProps = {
  content: CrmFeedbackRoundsDictionary["detail"];
  kindLabels: CrmFeedbackRoundsDictionary["kind"];
  item: FeedbackRoundItemDto;
  number: number;
  /** Rendered only with `files.read` on the project; without it the item shows text only. */
  attachments?: ReactNode;
};

/** One customer item as the team reads it: where, what kind, the text and the files. */
export function FeedbackItemRow({
  content,
  kindLabels,
  item,
  number,
  attachments,
}: FeedbackItemRowProps) {
  return (
    <li className={styles.item}>
      <FeedbackReadOnlyItemContent
        attachments={attachments}
        generalLabel={content.general}
        item={item}
        kindLabels={kindLabels}
        leading={
          <span className={styles.number}>
            {formatMessage(content.itemNumber, { number })}
          </span>
        }
        textLabels={{ showMore: content.showMore, showLess: content.showLess }}
      />
    </li>
  );
}
