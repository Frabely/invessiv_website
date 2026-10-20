import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import { getFeedbackItemProcessingState } from "@invessiv/common/patterns/crm/feedback-item-processing-state";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { FeedbackProgressDictionary } from "@/common/contracts/crm/feedback-progress-dictionary";
import { summarizeFeedbackProcessing } from "@/common/patterns/crm/feedback-processing-summary";
import styles from "./feedback-result-progress.module.css";

type FeedbackResultProgressProps = {
  items: readonly Pick<
    FeedbackRoundItemDto,
    "id" | "result" | "clarifications"
  >[];
  content: FeedbackProgressDictionary;
};

/**
 * One segment per item in list order, coloured by its processing state. An item is done once it
 * has a result and no open question. The sentences carry the meaning; the strip only lets the eye
 * find the open items at a glance.
 */
export function FeedbackResultProgress({
  items,
  content,
}: FeedbackResultProgressProps) {
  const summary = summarizeFeedbackProcessing(items);

  return (
    <div className={styles.progress}>
      <p className={styles.label}>
        {formatMessage(content.label, {
          done: summary.done,
          total: summary.total,
        })}
        {summary.clarifications > 0 ? (
          <span className={styles.clarifications}>
            {formatCountMessage(summary.clarifications, {
              one: content.clarificationsOne,
              many: content.clarifications,
            })}
          </span>
        ) : null}
      </p>
      <div aria-hidden="true" className={styles.strip}>
        {items.map((item) => (
          <span
            className={styles.segment}
            data-state={getFeedbackItemProcessingState(item)}
            key={item.id}
          />
        ))}
      </div>
    </div>
  );
}
