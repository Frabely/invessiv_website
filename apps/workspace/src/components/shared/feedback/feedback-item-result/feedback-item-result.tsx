import type { FeedbackItemResult as FeedbackItemResultValue } from "@invessiv/common/constants/crm/feedback-item-results";
import { Badge, LinkedText } from "@invessiv/ui";
import { FEEDBACK_ITEM_RESULT_BADGES } from "@/common/constants/feedback/feedback-item-result-badges";
import styles from "./feedback-item-result.module.css";

export type FeedbackItemResultProps = {
  result: FeedbackItemResultValue;
  /** Worded by the caller; the CRM and the portal share the labels but not the dictionary. */
  label: string;
  /** The team's reply; plain text, links become clickable, nothing else is interpreted. */
  note: string | null;
  noteLabel: string;
  /** The CRM row shows the result in its own select and only needs the reply here. */
  showBadge?: boolean;
};

/** One item's outcome as the customer reads it: the result, and the team's reply if there is one. */
export function FeedbackItemResult({
  result,
  label,
  note,
  noteLabel,
  showBadge = true,
}: FeedbackItemResultProps) {
  const badge = FEEDBACK_ITEM_RESULT_BADGES[result];
  return (
    <div className={styles.result} data-result={result}>
      {showBadge ? (
        <Badge
          icon={badge.icon}
          kind="status"
          label={label}
          tone={badge.tone}
        />
      ) : null}
      {note ? (
        <div className={styles.reply}>
          <span className={styles.replyLabel}>{noteLabel}</span>
          <p className={styles.replyText}>
            <LinkedText text={note} />
          </p>
        </div>
      ) : null}
    </div>
  );
}
