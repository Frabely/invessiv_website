"use client";

import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import { FEEDBACK_ITEM_KIND_ICONS } from "@/common/constants/feedback/feedback-item-kind-icons";
import { FeedbackItemText } from "../feedback-item-text/feedback-item-text";
import styles from "./feedback-read-only-item-content.module.css";

export type FeedbackReadOnlyItemContentProps = {
  item: Pick<FeedbackRoundItemDto, "areaLabel" | "kind" | "body">;
  generalLabel: string;
  kindLabels: Record<NonNullable<FeedbackRoundItemDto["kind"]>, string>;
  textLabels: { showMore: string; showLess: string };
  leading: ReactNode;
  attachments?: ReactNode;
  compact?: boolean;
};

/** Shared read-only point presentation; each side supplies its own permitted attachments. */
export function FeedbackReadOnlyItemContent({
  item,
  generalLabel,
  kindLabels,
  textLabels,
  leading,
  attachments,
  compact = false,
}: FeedbackReadOnlyItemContentProps) {
  return (
    <div className={styles.content} data-compact={compact ? "true" : "false"}>
      <div className={styles.head}>
        {leading}
        <span className={styles.area}>{item.areaLabel ?? generalLabel}</span>
        {item.kind ? (
          <span className={styles.kind} data-kind={item.kind}>
            <FontAwesomeIcon
              aria-hidden="true"
              icon={FEEDBACK_ITEM_KIND_ICONS[item.kind]}
            />
            {kindLabels[item.kind]}
          </span>
        ) : null}
      </div>
      {item.body ? (
        <FeedbackItemText labels={textLabels} text={item.body} />
      ) : null}
      {attachments}
    </div>
  );
}
