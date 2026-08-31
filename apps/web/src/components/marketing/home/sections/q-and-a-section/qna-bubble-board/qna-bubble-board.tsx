"use client";

import { useState } from "react";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type {
  QnaDisclosureCopy,
  QnaIntroCopy,
  QnaItemCopy,
  QnaSecondaryContactCopy,
} from "@/common/contracts/marketing/qna-copy";
import { QnaAvatar } from "../qna-avatar/qna-avatar";
import { QnaContactCta } from "../qna-contact-cta/qna-contact-cta";
import { QnaIntroBubble } from "../qna-intro-bubble/qna-intro-bubble";
import { QnaQuestionBubble } from "../qna-question-bubble/qna-question-bubble";
import styles from "./qna-bubble-board.module.css";

type QnaBubbleBoardProps = {
  avatarAlt: string;
  disclosure: QnaDisclosureCopy;
  id: string;
  intro: QnaIntroCopy;
  items: QnaItemCopy[];
  secondaryContact?: QnaSecondaryContactCopy;
  title: string;
};

// Narrow viewports show a first batch and keep the rest behind the toggle; the
// desktop ring has room for every question at once.
const MOBILE_VISIBLE_COUNT = 4;

export function QnaBubbleBoard({
  avatarAlt,
  disclosure,
  id,
  intro,
  items,
  secondaryContact,
  title,
}: QnaBubbleBoardProps) {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const entries = items.map((item, index) => ({
    answerId: `${id}-answer-${index + 1}`,
    index,
    item,
    questionId: `${id}-question-${index + 1}`,
  }));
  // Enough questions get arranged as a ring around the portrait rather than
  // two plain lists; short sets stay in the two side columns.
  const ringCount = entries.length >= 8 ? 2 : 0;
  const sideCount = entries.length - ringCount * 2;
  const leftCount = Math.ceil(sideCount / 2);
  const columns = (
    [
      { entries: entries.slice(0, ringCount), side: "top" },
      {
        entries: entries.slice(ringCount, ringCount + leftCount),
        side: "left",
      },
      {
        entries: entries.slice(ringCount + leftCount, ringCount + sideCount),
        side: "right",
      },
      { entries: entries.slice(ringCount + sideCount), side: "bottom" },
    ] as const
  ).filter((column) => column.entries.length > 0);

  const hasHiddenQuestions = entries.length > MOBILE_VISIBLE_COUNT;

  const handleDisclosureToggle = () => {
    const openEntry = entries.find(
      (entry) => entry.questionId === openQuestionId,
    );

    // Collapsing must not leave an answer open inside the hidden batch.
    if (isExpanded && openEntry && openEntry.index >= MOBILE_VISIBLE_COUNT) {
      setOpenQuestionId(null);
    }

    setIsExpanded(!isExpanded);
  };

  return (
    <div className={styles.board} data-qna-expanded={String(isExpanded)}>
      <h2 className="sr-only">{title}</h2>

      <div className={styles.portrait}>
        <div className={styles.avatarSlot}>
          <QnaAvatar alt={avatarAlt} />
        </div>

        <div className={styles.introSlot}>
          <QnaIntroBubble primary={intro.primary} secondary={intro.secondary} />
        </div>
      </div>

      {columns.map((column) => (
        <ul
          className={styles.column}
          data-qna-column={column.side}
          key={column.side}
        >
          {column.entries.map((entry) => (
            <li
              className={styles.item}
              data-qna-overflow={String(entry.index >= MOBILE_VISIBLE_COUNT)}
              data-qna-side={column.side}
              key={entry.questionId}
            >
              <QnaQuestionBubble
                answerId={entry.answerId}
                isOpen={openQuestionId === entry.questionId}
                item={entry.item}
                onToggle={() => {
                  setOpenQuestionId(
                    openQuestionId === entry.questionId
                      ? null
                      : entry.questionId,
                  );
                }}
                questionId={entry.questionId}
              />
            </li>
          ))}
        </ul>
      ))}

      {hasHiddenQuestions ? (
        <div className={styles.disclosureSlot}>
          <button
            aria-expanded={isExpanded}
            className={styles.disclosure}
            onClick={handleDisclosureToggle}
            type="button"
          >
            {isExpanded ? disclosure.lessLabel : disclosure.moreLabel}
            <FontAwesomeIcon
              aria-hidden="true"
              className={styles.disclosureMarker}
              icon={faChevronDown}
            />
          </button>
        </div>
      ) : null}

      {secondaryContact ? (
        <div className={styles.ctaSlot}>
          <QnaContactCta
            hint={secondaryContact.hint}
            href={secondaryContact.href}
            label={secondaryContact.label}
          />
        </div>
      ) : null}
    </div>
  );
}
