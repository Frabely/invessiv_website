import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { QnaItemCopy } from "@/common/contracts/marketing/qna-copy";
import styles from "./qna-question-bubble.module.css";

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
  return (
    <div className={styles.bubble} data-open={isOpen ? "true" : "false"}>
      <button
        aria-controls={answerId}
        aria-expanded={isOpen}
        className={styles.disclosure}
        onClick={onToggle}
        type="button"
      >
        <span className={styles.question} id={questionId}>
          {item.question}
        </span>
        <FontAwesomeIcon
          aria-hidden="true"
          className={styles.marker}
          icon={isOpen ? faMinus : faPlus}
        />
      </button>
      <div
        aria-hidden={isOpen ? undefined : true}
        aria-labelledby={questionId}
        className={styles.answerWrap}
        id={answerId}
      >
        <div className={styles.answerContent}>
          <p className={styles.answer}>{item.answer}</p>
          {item.link && isOpen ? (
            <a className={styles.answerLink} href={item.link.href}>
              {item.link.label}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
