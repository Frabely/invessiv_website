import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import type { MouseEvent } from "react";

import { AnalyticsArea } from "@/common/constants/analytics/analytics-area";
import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsPage } from "@/common/constants/analytics/analytics-page";
import type { QnaItemCopy } from "@/common/contracts/marketing/qna-copy";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import { getNavigationItem } from "@/lib/analytics/get-navigation-item";
import styles from "./qna-question-bubble.module.css";
import { ActionIcon, QuaternaryCta } from "@invessiv/ui";

type QnaQuestionBubbleProps = {
  answerId: string;
  isOpen: boolean;
  item: QnaItemCopy;
  onToggle: () => void;
  questionId: string;
};

export function QnaQuestionBubble({
  answerId,
  isOpen,
  item,
  onToggle,
  questionId,
}: QnaQuestionBubbleProps) {
  // Mouse shortcut only; the disclosure button stays the accessible control.
  const closeFromAnswer = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;

    if (!isOpen || target.closest("a") || window.getSelection()?.toString()) {
      return;
    }

    onToggle();
  };

  return (
    <div className={styles.bubble} data-open={isOpen ? "true" : "false"}>
      <button
        aria-controls={answerId}
        aria-expanded={isOpen}
        className={styles.disclosure}
        onClick={onToggle}
        type="button"
        {...(isOpen
          ? {}
          : analyticsAttributes(AnalyticsEventName.FaqOpened, {
              page: AnalyticsPage.Home,
              question: questionId,
            }))}
      >
        <span className={styles.question} id={questionId}>
          {item.question}
        </span>
        <span aria-hidden="true" className={styles.marker}>
          <ActionIcon icon={isOpen ? faMinus : faPlus} />
        </span>
      </button>
      <div
        aria-hidden={isOpen ? undefined : true}
        aria-labelledby={questionId}
        className={styles.answerWrap}
        id={answerId}
        onClick={closeFromAnswer}
      >
        <div className={styles.answerContent}>
          <p className={styles.answer}>{item.answer}</p>
          {item.link && isOpen ? (
            <QuaternaryCta
              className={styles.answerLink}
              href={item.link.href}
              {...analyticsAttributes(AnalyticsEventName.NavClicked, {
                item: getNavigationItem(item.link.href),
                area: AnalyticsArea.Faq,
              })}
            >
              {item.link.label}
            </QuaternaryCta>
          ) : null}
        </div>
      </div>
    </div>
  );
}
