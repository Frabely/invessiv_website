import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FeedbackResultChoice } from "@/common/constants/feedback/feedback-result-choices";
import styles from "./feedback-result-progress.module.css";

type FeedbackResultProgressProps = {
  items: readonly Pick<FeedbackRoundItemDto, "id" | "result">[];
  /** "{rated} of {total} items rated". */
  label: string;
};

/**
 * One segment per item in list order, coloured by its result. The sentence carries the meaning; the
 * strip only lets the eye find the open items at a glance.
 */
export function FeedbackResultProgress({
  items,
  label,
}: FeedbackResultProgressProps) {
  const rated = items.filter((item) => item.result !== null).length;
  return (
    <div className={styles.progress}>
      <p className={styles.label}>
        {formatMessage(label, { rated, total: items.length })}
      </p>
      <div aria-hidden="true" className={styles.strip}>
        {items.map((item) => (
          <span
            className={styles.segment}
            data-result={item.result ?? FeedbackResultChoice.Pending}
            key={item.id}
          />
        ))}
      </div>
    </div>
  );
}
